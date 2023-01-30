const parsers = require("./parsers");
const MSSQLService = require("./mssql.service");
const {
  listRolesAuto,
  listUsersAuto,
  listTablesAuto,
  listDatabasesAuto,
  listDatabasesOrAll,
  listTablesOrAll,
} = require("./autocomplete");

async function executeQuery(action, settings) {
  const { query } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.executeQuery({
    query: parsers.string(query),
  });
}

async function executeSQLFile(action, settings) {
  const { path } = action.params;

  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.executeSQLFile({
    path: parsers.path(path),
  });
}

async function testConnectivity(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.testConnectivity();
}

async function getTablesLocks(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.getTablesLocks({
    db: parsers.autocomplete(action.params.db),
    table: parsers.autocomplete(action.params.table),
  });
}

async function getServerVersion(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.getServerVersion();
}

async function getDbSize(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.getDbSize({
    db: parsers.autocomplete(action.params.db),
  });
}

async function getTablesSize(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.getTablesSize({
    db: parsers.autocomplete(action.params.db),
    table: parsers.autocomplete(action.params.table),
  });
}

async function createUser(action, settings) {
  const {
    user, pass, role, db, table, dbScope, tableScope,
  } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.createUser({
    user: parsers.string(user),
    role: parsers.autocomplete(role),
    db: parsers.autocomplete(db),
    table: parsers.autocomplete(table),
    pass,
    dbScope,
    tableScope,
  });
}

async function grantDbPermissions(action, settings) {
  const {
    scope, user, db, table, role,
  } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.grantDbPermissions({
    user: parsers.autocomplete(user),
    db: parsers.autocomplete(db),
    table: parsers.autocomplete(table),
    role: parsers.autocomplete(role),
    scope,
  });
}

async function grantTablePermissions(action, settings) {
  const {
    scope, user, table, role,
  } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.grantTablePermissions({
    user: parsers.autocomplete(user),
    table: parsers.autocomplete(table),
    role: parsers.autocomplete(role),
    scope,
  });
}

async function createRole(action, settings) {
  const {
    role, db, table, dbScope, tableScope,
  } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.createRole({
    role: parsers.autocomplete(role),
    db: parsers.autocomplete(db),
    table: parsers.autocomplete(table),
    dbScope,
    tableScope,
  });
}

async function addRoleMember(action, settings) {
  const { role, user } = action.params;
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.addRoleMember({
    role: parsers.autocomplete(role),
    user: parsers.autocomplete(user),
  });
}

async function listDbs(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.listDbs();
}

async function listRoles(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.listRoles();
}

async function listUsers(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.listUsers();
}

async function listTables(action, settings) {
  const mssql = await MSSQLService.from(action.params, settings);
  return mssql.listTables({
    db: parsers.autocomplete(action.params.db),
  });
}

module.exports = {
  executeQuery,
  executeSQLFile,
  testConnectivity,
  getTablesLocks,
  getServerVersion,
  getDbSize,
  getTablesSize,
  createUser,
  grantDbPermissions,
  grantTablePermissions,
  createRole,
  addRoleMember,
  listDbs,
  listRoles,
  listUsers,
  listTables,
  listRolesAuto,
  listUsersAuto,
  listTablesAuto,
  listDatabasesAuto,
  listDatabasesOrAll,
  listTablesOrAll,
};
