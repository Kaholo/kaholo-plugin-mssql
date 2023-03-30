const { injectMSSQLClient } = require("./helpers");

function createAutocompleteMethod(
  clientMethodName,
  addAllOption = false,
) {
  return injectMSSQLClient(async (client, query, params) => {
    const result = await client[clientMethodName]?.call?.(client, params);

    const items = mapResultToAutocompleteItems(result, query);
    if (addAllOption) {
      items.unshift({ id: "*", value: "All" });
    }

    return items;
  }, 1);
}

function mapResultToAutocompleteItems(result, query) {
  if (!result || result.length === 0) {
    return [];
  }

  const mappedItems = result.map((item) => ({
    id: item.name,
    value: item.name,
  }));

  return filterItems(mappedItems, query);
}

function filterItems(items, query) {
  if (!query) {
    return items;
  }

  const lowerCaseQuery = query.toLowerCase();
  const sortedItems = items.filter((item) => (
    item.id.toLowerCase().includes(lowerCaseQuery)
    || item.name.toLowerCase().includes(lowerCaseQuery)
  ));

  return sortedItems;
}

module.exports = {
  listRolesAuto: createAutocompleteMethod("listRoles"),
  listUsersAuto: createAutocompleteMethod("listUsers"),
  listTablesAuto: createAutocompleteMethod("listTables"),
  listDatabasesAuto: createAutocompleteMethod("listDbs"),
  listDatabasesOrAll: createAutocompleteMethod("listDbs", true),
  listTablesOrAll: createAutocompleteMethod("listTables", true),
};
