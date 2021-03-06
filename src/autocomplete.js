const parsers = require("./parsers");
const MSSQLService = require('./mssql.service');

// auto complete helper methods

const MAX_RESULTS = 10;

function mapAutoParams(autoParams){
  const params = {};
  autoParams.forEach(param => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

/***
 * @returns {[{id, value}]} filtered result items
 ***/
function handleResult(result, query){
  if (!result || result.length == 0) return [];
  const items = result.map(item => getAutoResult(item.name));
  return filterItems(items, query);
}

function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id
  };
}

function filterItems(items, query){
  if (query){
    const qWords = query.split(/[. ]/g).map(word => word.toLowerCase()); // split by '.' or ' ' and make lower case
    items = items.filter(item => qWords.every(word => item.value.toLowerCase().includes(word)));
    items = items.sort((word1, word2) => word1.value.toLowerCase().indexOf(qWords[0]) - word2.value.toLowerCase().indexOf(qWords[0]));
  }
  return items.splice(0, MAX_RESULTS);
}

function listAuto(listFuncName, addAllOption) {
  return async (query, pluginSettings, triggerParameters) => {
    const settings = mapAutoParams(pluginSettings), params = mapAutoParams(triggerParameters); 
    const client = await MSSQLService.from(params, settings);
    const result = await client[listFuncName](params);
    const items = handleResult(result, query);
    return addAllOption ? [{id: "*", value: "All"}, ...items] : items;
  }
}


module.exports = {
  listRolesAuto: listAuto("listRoles"),
  listUsersAuto: listAuto("listUsers"),
  listTablesAuto: listAuto("listTables"),
  listDatabasesAuto: listAuto("listDbs"),
  listDatabasesOrAll: listAuto("listDbs", true),
  listTablesOrAll: listAuto("listTables", true)
}