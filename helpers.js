const kaholoPluginLibrary = require("@kaholo/plugin-library");
const fs = require("fs");
const MSSQLClient = require("./mssql-client");

function injectMSSQLClient(funcToInject, paramsArgPosition = 0) {
  return async (...args) => {
    const mssqlParams = args[paramsArgPosition];
    if (typeof mssqlParams.additionalConnectionStringItems === "string") {
      mssqlParams.additionalConnectionStringItems = kaholoPluginLibrary.parsers.keyValuePairs(
        mssqlParams.additionalConnectionStringItems,
      );
    }

    const mssqlClient = await MSSQLClient.from(mssqlParams);
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
