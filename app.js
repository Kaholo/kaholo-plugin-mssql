const fs = require("fs/promises");
const kaholoPluginLibrary = require("@kaholo/plugin-library");

const {
  createMSSQLClientMethodCallback,
  injectMSSQLClient,
  assertPath,
} = require("./helpers");
const autocomplete = require("./autocomplete");

const trivialPluginMethods = {
  executeQuery: createMSSQLClientMethodCallback("executeQuery"),
  testConnectivity: createMSSQLClientMethodCallback("testConnectivity"),
  getTablesLocks: createMSSQLClientMethodCallback("getTablesLocks"),
  getServerVersion: createMSSQLClientMethodCallback("getServerVersion"),
  getDbSize: createMSSQLClientMethodCallback("getDbSize"),
  getTablesSize: createMSSQLClientMethodCallback("getTablesSize"),
  createUser: createMSSQLClientMethodCallback("createUser"),
  createRole: createMSSQLClientMethodCallback("createRole"),
  grantDbPermissions: createMSSQLClientMethodCallback("grantDbPermissions"),
  grantTablePermissions: createMSSQLClientMethodCallback("grantTablePermissions"),
  addRoleMember: createMSSQLClientMethodCallback("addRoleMember"),
  listDbs: createMSSQLClientMethodCallback("listDbs"),
  listRoles: createMSSQLClientMethodCallback("listRoles"),
  listUsers: createMSSQLClientMethodCallback("listUsers"),
  listTables: createMSSQLClientMethodCallback("listTables"),
};

async function executeSQLFile(mssql, params) {
  const { path } = params;

  await assertPath(path);
  const sqlScript = await fs.readFile(path, "utf-8");

  return mssql.executeQuery({
    query: sqlScript,
  });
}

module.exports = kaholoPluginLibrary.bootstrap({
  ...trivialPluginMethods,
  executeSQLFile: injectMSSQLClient(executeSQLFile),
}, autocomplete);
