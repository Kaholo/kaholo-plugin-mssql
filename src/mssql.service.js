const sql = require('mssql')
const fs = require('fs');

module.exports = class MSSQLService{
    constructor({conStr}){
        if (!conStr) throw "Must provide a connection string to use to connect to MSSQL.";
        this.conStr = conStr;
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
    
    async close(){
        await this.pool.close();
    }

    async executeQuery({query, dontClose, db, getRecordset}){
        if (!query) throw "Must specify SQL query to execute";
        if (db) query += `USE ${db};\n`;
        const result = await this.pool.request().query(query);
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
        const query = `SELECT * FROM sys.dm_tran_locks
WHERE resource_database_id = DB_ID()${table ? `
AND resource_associated_entity_id = OBJECT_ID(N'dbo.${table}')` : ""};`
        return this.executeQuery({query, db, getRecordset: true});
    }
    
    async getServerVersion(){
        const query = `SELECT @@version;`;
        return this.executeQuery({query, getRecordset: true});
    }
    
    async getDbSize({db}){
        const query = `SELECT 
    database_name = DB_NAME(database_id), 
    log_size_mb = CAST(SUM(CASE WHEN type_desc = 'LOG' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
    row_size_mb = CAST(SUM(CASE WHEN type_desc = 'ROWS' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
    total_size_mb = CAST(SUM(size) * 8. / 1024 AS DECIMAL(8,2))
FROM sys.master_files WITH(NOWAIT)
WHERE database_id = DB_ID()
GROUP BY database_id;`;
        return this.executeQuery({query, db, getRecordset: true});
    }
    
    async getTablesSize({db, table}){
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
    s.Name = '${db && db !== "*"}''` : ""}
    t.NAME ${table && table !== "*" ? `= '${table}'` : "NOT LIKE 'dt%'"} 
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
        const result = {createUser: await this.executeQuery({query, dontClose: true})};
        if (role){
            result.addRole = await this.addRoleMember({user, role, dontClose: true});
        }
        if (dbScope){
            result.grantDbPermissions = await this.grantDbPermissions({
                user, db, 
                scope: dbScope, 
                dontClose: true
            });
        }
        if (tableScope){
            result.grantTablePermissions = await this.grantTablePermissions({
                user, db, table, 
                scope: tableScope, 
                dontClose: true
            });
        }
        await this.close();
        return result;
    }

    async addRoleMember({user, role, dontClose}){
        if (!user || !role) throw "Didn't provide one of the required parameters.";
        const query = `EXEC sp_addrolemember '${role}', '${user}';`;
        return this.executeQuery({query, dontClose});
    }

    async grantDbPermissions({user, db, scope, dontClose}){
        if (!scope || !user || !db) throw "Didn't provide one of the required parameters.";

        const query = `GRANT ${scope == "readWrite" ? "INSERT, DELETE, UPDATE, SELECT" : 
            scope == "write" ? "INSERT, DELETE, UPDATE" : 
            scope == "read" ? "SELECT" : scope} TO ${user};`;
        
        return this.executeQuery({query, db, dontClose});
    }
    
    async grantTablePermissions({user, db, table, scope, dontClose}){
        if (!scope || !user || !db || !table) throw "Didn't provide one of the required parameters.";
        
        const query = `GRANT ${scope == "readWrite" ? "INSERT, DELETE, UPDATE, SELECT" : 
            scope == "write" ? "INSERT, DELETE, UPDATE" : 
            scope == "read" ? "SELECT" : scope } ON ${db}.${table} TO ${user};`;
        
        return this.executeQuery({query, db, dontClose});
    }

    async createRole({role, db, table, dbScope, tableScope}){
        if (!role) throw "Must specify role to create";
        const query = `CREATE ROLE ${role};`;
        const result = {createRole: await this.executeQuery({
            dontClose: true,
            query
        })};
        if (dbScope){
            result.grantDbPermissions = await this.grantDbPermissions({
                user: role, 
                scope: dbScope, 
                dontClose: true,
                db
            });
        }
        if (tableScope){
            result.grantTablePermissions = await this.grantTablePermissions({
                user: role, 
                scope: tableScope, 
                dontClose: true,
                db, table
            });
        }
        await this.close();
        return result;
    }
    
    async listDbs(){
        const query = `SELECT name FROM sys.databases;`;
        return this.executeQuery({query, getRecordset: true});
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
        const query = `SELECT TABLE_NAME AS name FROM ${db && db !== "*" ? db + "." : ""}INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE='BASE TABLE'`;
        const result = await this.executeQuery({query, getRecordset: true});
        if (result.length == 0 && !db){
            throw "Must specify a database in connection string or in parameter.";
        }
    }
}