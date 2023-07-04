function buildConnectionString(params) {
  const userConnectionStringEntries = params.additionalConnectionStringItems || {};
  const connectionStringEntries = new Map(Object.entries({
    Server: params.host,
    "User Id": params.username,
    ...userConnectionStringEntries,
  }));

  if (params.password) {
    connectionStringEntries.set("Password", params.password);
  }

  const conStr = [...connectionStringEntries.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .join(";");

  return conStr;
}

function translatePermissionScope(scope) {
  const scopesMap = new Map([
    ["READ_WRITE", "INSERT, DELETE, UPDATE, SELECT"],
    ["WRITE", "INSERT, DELETE, UPDATE"],
    ["READ", "SELECT"],
    ["FULL", "ALL"],
    ["ALTER", "ALTER"],
    ["CONTROL", "CONTROL"],
  ]);

  return scopesMap.get(scope) || scope;
}

function createRethrowerWithActionName(actionName) {
  return (error) => {
    // eslint-disable-next-line no-throw-literal
    throw {
      originalError: error,
      actionName,
    };
  };
}

module.exports = {
  buildConnectionString,
  translatePermissionScope,
  createRethrowerWithActionName,
};
