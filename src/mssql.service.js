const sql = require('mssql')
const fs = require('fs');

module.exports = class MSSQLService{
    constructor({conStr}){
        if (!conStr) throw "Must provide a connection string to use to connect to MSSQL.";
        this.conStr = conStr;
        this.rolledback = false;
    }

    static translatePermissionScope(scope){
        return  scope == "readWrite" ? "INSERT, DELETE, UPDATE, SELECT" : 
                scope == "write" ? "INSERT, DELETE, UPDATE" : 
                scope == "read" ? "SELECT" : 
                scope == "full" ? "ALL" : 
                scope;
    }

    static async from(params, settings){
        const result = new MSSQLService({
            conStr: params.conStr || settings.conStr
        });
        await result.connect();
        return result;
    }

    async connect(){
        this.pool = await sql.connect(this.conStr);
    }

    async startTransaction(){
        this.transaction = await new sql.Transaction(this.pool);
        this.transaction.on('rollback', () => {this.rolledback = true});
        await this.transaction.begin();
    }
    
    async rollback(){
        if (!this.rolledback) await this.transaction.rollback();
    }

    async commitTransaction(){
        await this.transaction.commit();
    }
    
    async close(){
        await this.pool.close();
    }

    async executeQuery({query, dontClose, db, getRecordset}){
        if (!query) throw "Must specify SQL query to execute";
        if (db && db !== "*" && db !== "dbo") query += `USE ${db};\n`;
        const request = this.transaction ? new sql.Request(this.transaction) : this.pool.request();
        const result = await request.query(query);
        if (!dontClose){
            await this.close();
        }
        return getRecordset ? result.recordset : result;
    }
    
    async executeSQLFile({path}){
        if (!path) throw "Must specify path of SQL script to execute";
        if (!fs.existsSync(path)) throw `File '${path}' wasn't found`;
        const sqlScript = fs.readFileSync(path, 'utf-8');
        return this.executeQuery({query: sqlScript})
    }
    
    async testConnectivity(){
        await this.close();
        return "Connected";
    }
    
    async getTablesLocks({db, table}){
        if (db === "*") db = undefined;
        if (table === "*") table = undefined;
        const query = `SELECT * FROM sys.dm_tran_locks${db ? `
WHERE resource_database_id = DB_ID()`: ""}${table ? `
AND resource_associated_entity_id = OBJECT_ID(N'${db}.${table}')` : ""};`
        return this.executeQuery({query, db, getRecordset: true});
    }
    
    async getServerVersion(){
        const query = `SELECT @@version;`;
        return this.executeQuery({query, getRecordset: true});
    }
    
    async getDbSize({db}){
        if (db === "*") db = undefined;
        const query = `SELECT 
    database_name = DB_NAME(database_id), 
    log_size_mb = CAST(SUM(CASE WHEN type_desc = 'LOG' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
    row_size_mb = CAST(SUM(CASE WHEN type_desc = 'ROWS' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
    total_size_mb = CAST(SUM(size) * 8. / 1024 AS DECIMAL(8,2))
FROM sys.master_files WITH(NOWAIT)${(db) ? `
WHERE database_id = DB_ID()` : ""}
GROUP BY database_id;`;
        return this.executeQuery({query, db, getRecordset: true});
    }
    
    async getTablesSize({db, table}){
        if (db === "*") db = undefined;
        if (table === "*") table = undefined;
        const query = `SELECT 
    t.NAME AS table_name,
    s.Name AS database_name,
    p.rows,
    CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS total_space_mb,
    CAST(ROUND(((SUM(a.used_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS used_space_mb, 
    CAST(ROUND(((SUM(a.total_pages) - SUM(a.used_pages)) * 8) / 1024.00, 2) AS NUMERIC(36, 2)) AS unused_space_mb
FROM 
    sys.tables t
INNER JOIN      
    sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN 
    sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN 
    sys.allocation_units a ON p.partition_id = a.container_id
LEFT OUTER JOIN 
    sys.schemas s ON t.schema_id = s.schema_id
WHERE${db ? `
    s.Name = '${db}' AND` : ""}
    t.NAME ${table ? `= '${table}'` : "NOT LIKE 'dt%'"} 
    AND t.is_ms_shipped = 0
    AND i.OBJECT_ID > 255 
GROUP BY 
    t.Name, s.Name, p.Rows
ORDER BY 
    total_space_mb DESC, t.Name, s.Name;`;
    return this.executeQuery({query, getRecordset: true});
    }
    
    async createUser({user, pass, role, db, table, dbScope, tableScope}){
        if (!user || !pass) throw "Didn't provide one of the required parameters.";
        const query = `CREATE LOGIN ${user} WITH PASSWORD = '${pass}';
CREATE USER ${user} FOR LOGIN ${user};`;
        await this.startTransaction();
        let lastAction = "createUser";
        try {
            const result = {createUser: await this.executeQuery({query, dontClose: true})};
            if (role){
                lastAction = "addRole";
                result.addRole = await this.addRoleMember({user, role, dontClose: true});
            }
            if (dbScope){
                lastAction = "grantDbPermissions";
                result.grantDbPermissions = await this.grantDbPermissions({
                    user, db, 
                    scope: dbScope, 
                    dontClose: true
                });
            }
            if (tableScope){
                lastAction = "grantTablePermissions";
                result.grantTablePermissions = await this.grantTablePermissions({
                    user, db, table, 
                    scope: tableScope, 
                    dontClose: true
                });
            }
            lastAction = "commitTransaction";
            await this.commitTransaction();
            return result;
        }
        catch (error) {
            await this.rollback();
            throw `Error with '${lastAction}': ${error.message || JSON.stringify(error)}`;
        }
        finally {
            await this.close();
        }
    }

    async addRoleMember({user, role, dontClose}){
        if (!user || !role) throw "Didn't provide one of the required parameters.";
        const query = `EXEC sp_addrolemember '${role}', '${user}';`;
        return this.executeQuery({query, dontClose});
    }

    async grantDbPermissions({user, db, scope, dontClose}){
        if (!scope || !user || !db) throw "Didn't provide one of the required parameters.";

        const query = `GRANT ${MSSQLService.translatePermissionScope(scope)} TO ${user};`;
        
        return this.executeQuery({query, db, dontClose});
    }
    
    async grantTablePermissions({user, db, table, scope, dontClose}){
        if (!scope || !user || !db || !table) throw "Didn't provide one of the required parameters.";
        
        const query = `GRANT ${MSSQLService.translatePermissionScope(scope)} ON ${db}.${table} TO ${user};`;
        
        return this.executeQuery({query, db, dontClose});
    }

    async createRole({role, db, table, dbScope, tableScope}){
        if (!role) throw "Must specify role to create";
        const query = `CREATE ROLE ${role};`;
        await this.startTransaction();
        let lastAction = "createRole";
        try {
            const result = {createRole: await this.executeQuery({
                dontClose: true,
                query
            })};
            if (dbScope){
                lastAction = "grantDbPermissions";
                result.grantDbPermissions = await this.grantDbPermissions({
                    user: role, 
                    scope: dbScope, 
                    dontClose: true,
                    db
                });
            }
            if (tableScope){
                lastAction = "grantTablePermissions";
                result.grantTablePermissions = await this.grantTablePermissions({
                    user: role, 
                    scope: tableScope, 
                    dontClose: true,
                    db, table
                });
            }
            lastAction = "commitTransaction";
            await this.commitTransaction();
            return result;
        }
        catch (error) {
            await this.rollback();
            throw `Error with '${lastAction}': ${error.message || JSON.stringify(error)}`;
        }
        finally {
            await this.close();
        }
    }
    
    async listDbs(){
        const query = `SELECT name FROM sys.databases;`;
        const result = [{name: "dbo"}, ...(await this.executeQuery({query, getRecordset: true}))]
        return result;
    }
    
    async listRoles(){
        const query = `SELECT name FROM sysusers WHERE issqlrole = 1;`;
        return this.executeQuery({query, getRecordset: true});
    }
    
    async listUsers(){
        const query = `SELECT name FROM sysusers;`;
        return this.executeQuery({query, getRecordset: true});
    }
    
    async listTables({db}){
        if (db === "*") db = undefined;
        const query = `SELECT 
        t.NAME AS name,
        s.Name AS database_name
    FROM 
        sys.tables t
    LEFT OUTER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id${db ? `
    WHERE
        s.Name = '${db}'` : ""}
    GROUP BY
        t.Name, s.Name
    ORDER BY
        t.Name, s.Name;`;
        return this.executeQuery({query, getRecordset: true});
    }
}