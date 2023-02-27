const kaholoPluginLibrary = require("@kaholo/plugin-library");

const mssqlService = require("./mssql.service");
const autocomplete = require("./autocomplete");

async function executeQuery(params) {
  const { query } = params;

  const mssql = await mssqlService.from(params);
  return mssql.executeQuery({ query });
}

async function executeSQLFile(params) {
  const { path } = params;

  const mssql = await mssqlService.from(params);
  return mssql.executeSQLFile({ path });
}

async function testConnectivity(params) {
  const mssql = await mssqlService.from(params);
  return mssql.testConnectivity();
}

async function getTablesLocks(params) {
  const {
    db,
    table,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.getTablesLocks({
    db,
    table,
  });
}

async function getServerVersion(params) {
  const mssql = await mssqlService.from(params);
  return mssql.getServerVersion();
}

async function getDbSize(params) {
  const {
    db,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.getDbSize({ db });
}

async function getTablesSize(params) {
  const {
    db,
    table,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.getTablesSize({
    db,
    table,
  });
}

async function createUser(params) {
  const {
    user,
    pass,
    role,
    db,
    table,
    dbScope,
    tableScope,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.createUser({
    user,
    role,
    db,
    table,
    pass,
    dbScope,
    tableScope,
  });
}

async function grantDbPermissions(params) {
  const {
    scope,
    user,
    db,
    table,
    role,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.grantDbPermissions({
    user,
    db,
    table,
    role,
    scope,
  });
}

async function grantTablePermissions(params) {
  const {
    scope,
    user,
    table,
    role,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.grantTablePermissions({
    user,
    table,
    role,
    scope,
  });
}

async function createRole(params) {
  const {
    role,
    db,
    table,
    dbScope,
    tableScope,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.createRole({
    role,
    db,
    table,
    dbScope,
    tableScope,
  });
}

async function addRoleMember(params) {
  const {
    role,
    user,
  } = params;

  const mssql = await mssqlService.from(params);
  return mssql.addRoleMember({
    role,
    user,
  });
}

async function listDbs(params) {
  const mssql = await mssqlService.from(params);
  return mssql.listDbs();
}

async function listRoles(params) {
  const mssql = await mssqlService.from(params);
  return mssql.listRoles();
}

async function listUsers(params) {
  const mssql = await mssqlService.from(params);
  return mssql.listUsers();
}

async function listTables(params) {
  const { db } = params;

  const mssql = await mssqlService.from(params);
  return mssql.listTables({ db });
}

module.exports = kaholoPluginLibrary.bootstrap({
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
}, autocomplete);
