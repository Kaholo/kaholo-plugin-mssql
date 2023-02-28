const fs = require("fs");
const MSSQLClient = require("./mssql-client");

function injectMSSQLClient(funcToInject) {
  return async (...args) => {
    const mssqlClient = await MSSQLClient.from(args[0]);
    return funcToInject(mssqlClient, ...args);
  };
}

function createMSSQLClientMethodCallback(methodName) {
  return injectMSSQLClient((mssqlClient, ...args) => (
    mssqlClient[methodName]?.call?.(mssqlClient, ...args)
  ));
}

async function assertPath(path) {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch {
    throw new Error(`Path '${path}' does not exist`);
  }
}

module.exports = {
  injectMSSQLClient,
  createMSSQLClientMethodCallback,
  assertPath,
};
