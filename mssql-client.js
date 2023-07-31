const sql = require("mssql");

const {
  prepareGetTablesLocksQuery,
  prepareGenericQuery,
  prepareGetDbSizeQuery,
  prepareGetTablesSizeQuery,
  prepareCreateUserQuery,
  prepareAddRoleMemberQuery,
  prepareGrantDbPermissionsQuery,
  prepareGrantTablePermissionsQuery,
  prepareCreateRoleQuery,
  prepareListTablesQuery,
} = require("./prepare-query-functions");
const {
  createRethrowerWithActionName,
  buildConnectionString,
  translatePermissionScope,
} = require("./mssql-helpers");

class MSSQLClient {
  static async from(params) {
    const connectionString = buildConnectionString(params);

    const client = new MSSQLClient({ connectionString });
    await client.connect();

    return client;
  }

  constructor({ connectionString }) {
    this.connectionString = connectionString;
    this.rolledBack = false;
  }

  async connect() {
    this.pool = await sql.connect(this.connectionString);
  }

  async startTransaction() {
    this.transaction = new sql.Transaction(this.pool);
    this.transaction.on("rollback", () => {
      this.rolledBack = true;
    });
    await this.transaction.begin();
  }

  async rollback() {
    if (!this.rolledBack) {
      await this.transaction.rollback();
    }
  }

  async commitTransaction() {
    await this.transaction.commit();
  }

  async close() {
    await this.pool.close();
  }

  async executeQuery(params) {
    const {
      query,
      dontClose,
      db,
      getRecordSet,
    } = params;

    const revisedQuery = prepareGenericQuery({
      db,
      query,
    });

    const request = this.transaction ? new sql.Request(this.transaction) : this.pool.request();
    const result = await request.query(revisedQuery);
    if (!dontClose) {
      await this.close();
    }

    return getRecordSet ? result.recordset : result;
  }

  async testConnectivity() {
    await this.close();
    return "Connected";
  }

  async getTablesLocks(params) {
    const {
      db,
      table,
    } = params;

    const query = prepareGetTablesLocksQuery({
      db,
      table,
    });

    return this.executeQuery({
      query,
      db,
      getRecordSet: true,
    });
  }

  async getServerVersion() {
    return this.executeQuery({
      query: "SELECT @@version",
      getRecordSet: true,
    });
  }

  async getDbSize(params) {
    const { db } = params;

    const query = prepareGetDbSizeQuery({ db });

    return this.executeQuery({
      query,
      db,
      getRecordSet: true,
    });
  }

  async getTablesSize(params) {
    const {
      db,
      table,
    } = params;

    const query = prepareGetTablesSizeQuery({
      db,
      table,
    });

    return this.executeQuery({
      query,
      getRecordSet: true,
    });
  }

  async createUser(params) {
    const {
      user,
      pass,
      role,
      db,
      table,
      dbScope,
      tableScope,
    } = params;

    const query = prepareCreateUserQuery({ pass, user });

    const result = {
      createUser: null,
      addRole: null,
      grantDbPermissions: null,
      grantTablePermissions: null,
    };

    await this.startTransaction();

    try {
      result.createUser = await this.executeQuery({
        query,
        dontClose: true,
      }).catch(createRethrowerWithActionName("createUser"));

      if (role) {
        result.addRole = await this.addRoleMember({
          user,
          role,
          dontClose: true,
        }).catch(createRethrowerWithActionName("addRole"));
      }

      if (dbScope) {
        result.grantDbPermissions = await this.grantDbPermissions({
          user,
          db,
          scope: dbScope,
          dontClose: true,
        }).catch(createRethrowerWithActionName("grantDbPermissions"));
      }

      if (tableScope) {
        result.grantTablePermissions = await this.grantTablePermissions({
          user,
          db,
          table,
          scope: tableScope,
          dontClose: true,
        }).catch(createRethrowerWithActionName("grantTablePermissions"));
      }

      await this.commitTransaction().catch(createRethrowerWithActionName("commitTransaction"));

      return result;
    } catch (err) {
      const originalError = err.originalError || err;
      const actionName = err.actionName || "unknown";

      await this.rollback();
      throw new Error(`Error with '${actionName}': ${originalError.message || JSON.stringify(originalError)}`);
    } finally {
      await this.close();
    }
  }

  async addRoleMember(params) {
    const {
      user,
      role,
      dontClose,
    } = params;

    const query = prepareAddRoleMemberQuery({ user, role });

    return this.executeQuery({
      query,
      dontClose,
    });
  }

  async grantDbPermissions(params) {
    const {
      user,
      db,
      scope,
      dontClose,
    } = params;

    const query = prepareGrantDbPermissionsQuery({
      scope: translatePermissionScope(scope),
      user,
    });

    return this.executeQuery({
      query,
      db,
      dontClose,
    });
  }

  async grantTablePermissions(params) {
    const {
      user,
      db,
      table,
      scope,
      dontClose,
    } = params;

    const query = prepareGrantTablePermissionsQuery({
      user,
      table,
      db,
      scope: translatePermissionScope(scope),
    });

    return this.executeQuery({
      query,
      db,
      dontClose,
    });
  }

  async createRole(params) {
    const {
      role,
      db,
      table,
      dbScope,
      tableScope,
    } = params;

    const query = prepareCreateRoleQuery({ role });

    const result = {
      createRole: null,
      grantDbPermissions: null,
      grantTablePermissions: null,
    };

    await this.startTransaction();
    try {
      result.createRole = await this.executeQuery({
        dontClose: true,
        query,
      }).catch(createRethrowerWithActionName("createRole"));

      if (dbScope) {
        result.grantDbPermissions = await this.grantDbPermissions({
          user: role,
          scope: dbScope,
          dontClose: true,
          db,
        }).catch(createRethrowerWithActionName("grantDbPermissions"));
      }
      if (tableScope) {
        result.grantTablePermissions = await this.grantTablePermissions({
          user: role,
          scope: tableScope,
          dontClose: true,
          db,
          table,
        }).catch(createRethrowerWithActionName("grantTablePermissions"));
      }

      await this.commitTransaction().catch(createRethrowerWithActionName("commitTransaction"));

      return result;
    } catch (err) {
      const originalError = err.originalError || err;
      const actionName = err.actionName || "unknown";

      await this.rollback();
      throw new Error(`Error with '${actionName}': ${originalError.message || JSON.stringify(originalError)}`);
    } finally {
      await this.close();
    }
  }

  async listDbs() {
    const result = await this.executeQuery({
      query: "SELECT name FROM sys.databases;",
      getRecordSet: true,
    });

    return [
      { name: "dbo" },
      ...result,
    ];
  }

  async listRoles() {
    return this.executeQuery({
      query: "SELECT name FROM sysusers WHERE issqlrole = 1;",
      getRecordSet: true,
    });
  }

  async listUsers() {
    return this.executeQuery({
      query: "SELECT name FROM sysusers WHERE issqluser = 1;",
      getRecordSet: true,
    });
  }

  async listTables(params) {
    const { db } = params;

    const query = prepareListTablesQuery({ db });

    return this.executeQuery({
      query,
      getRecordSet: true,
    });
  }
}

module.exports = MSSQLClient;
