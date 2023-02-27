const MSSQLService = require("./mssql.service");

// auto complete helper methods

const MAX_RESULTS = 10;

/** *
 * @returns {[{id, value}]} filtered result items
 ** */
function handleResult(result, query) {
  if (!result || result.length === 0) {
    return [];
  }
  const items = result.map((item) => getAutoResult(item.name));
  return filterItems(items, query);
}

function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id,
  };
}

function filterItems(items, query) {
  let sortedItems = items;
  if (query) {
    // split by '.' or ' ' and make lower case
    const qWords = query.split(/[. ]/g).map((word) => word.toLowerCase());
    const filteredItems = items.filter(
      (item) => qWords.every((word) => item.value.toLowerCase().includes(word)),
    );
    sortedItems = filteredItems.sort(
      (word1, word2) => word1.value.toLowerCase().indexOf(
        qWords[0],
      ) - word2.value.toLowerCase().indexOf(qWords[0]),
    );
  }
  return sortedItems.splice(0, MAX_RESULTS);
}

function listAuto(listFuncName, addAllOption) {
  return async (query, params) => {
    const client = await MSSQLService.from(params);
    const result = await client[listFuncName](params);
    const items = handleResult(result, query);
    return addAllOption ? [{ id: "*", value: "All" }, ...items] : items;
  };
}

module.exports = {
  listRolesAuto: listAuto("listRoles"),
  listUsersAuto: listAuto("listUsers"),
  listTablesAuto: listAuto("listTables"),
  listDatabasesAuto: listAuto("listDbs"),
  listDatabasesOrAll: listAuto("listDbs", true),
  listTablesOrAll: listAuto("listTables", true),
};
