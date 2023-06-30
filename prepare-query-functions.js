function prepareGenericQuery(params) {
  const {
    db,
    query,
  } = params;

  let revisedQuery = query;
  if (db && db !== "*" && db !== "dbo") {
    revisedQuery = `USE ${db};\n${query}`;
  }

  return revisedQuery;
}

function prepareGetTablesLocksQuery(params) {
  const {
    db,
    table,
  } = params;

  let query = "SELECT * FROM sys.dm_tran_locks";
  if (db && db !== "*") {
    query += " WHERE resource_database_id = DB_ID()";
  }
  if (table && table !== "*") {
    query += ` AND resource_associated_entity_id = OBJECT_ID(N'${db}.${table}')`;
  }
  query += ";";

  return query;
}

function prepareGetDbSizeQuery(params) {
  const { db } = params;

  let query = `
SELECT 
  database_name = DB_NAME(database_id), 
  log_size_mb = CAST(SUM(CASE WHEN type_desc = 'LOG' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
  row_size_mb = CAST(SUM(CASE WHEN type_desc = 'ROWS' THEN size END) * 8. / 1024 AS DECIMAL(8,2)), 
  total_size_mb = CAST(SUM(size) * 8. / 1024 AS DECIMAL(8,2)) 
FROM sys.master_files WITH(NOWAIT)`;

  if (db && db !== "*") {
    query += " WHERE database_id = DB_ID() ";
  }
  query += "GROUP BY database_id;";

  return query;
}

function prepareGetTablesSizeQuery(params) {
  const {
    db,
    table,
  } = params;

  let query = `
SELECT 
  t.NAME AS table_name,
  s.Name AS database_name,
  p.rows,
  CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS total_space_mb,
  CAST(ROUND(((SUM(a.used_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS used_space_mb, 
  CAST(ROUND(((SUM(a.total_pages) - SUM(a.used_pages)) * 8) / 1024.00, 2) AS NUMERIC(36, 2)) AS unused_space_mb
FROM 
  sys.tables t
INNER JOIN      
  sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN 
  sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN 
  sys.allocation_units a ON p.partition_id = a.container_id
LEFT OUTER JOIN 
  sys.schemas s ON t.schema_id = s.schema_id
WHERE`;

  if (db && db !== "*") {
    query += ` s.Name = '${db}' AND`;
  }
  if (table && table !== "*") {
    query += ` t.NAME = '${table}'`;
  } else {
    query += " t.NAME NOT LIKE 'dt%'";
  }

  query += ` AND t.is_ms_shipped = 0
  AND i.OBJECT_ID > 255 
GROUP BY 
  t.Name, s.Name, p.Rows
ORDER BY 
  total_space_mb DESC, t.Name, s.Name;`;

  return query;
}

function prepareListTablesQuery(params) {
  const { db } = params;
  const querySegments = [];

  if (db && db !== "*") {
    querySegments.push(`USE ${db};`);
  }
  querySegments.push(`SELECT t.NAME as name, '${db}' as database_name FROM sys.tables t;`);

  const query = querySegments.join("\n");
  return query;
}

const prepareCreateRoleQuery = ({ role }) => `CREATE ROLE ${role};`;
const prepareCreateUserQuery = ({ user, pass }) => `CREATE LOGIN ${user} WITH PASSWORD = '${pass}'; CREATE USER ${user} FOR LOGIN ${user};`;
const prepareAddRoleMemberQuery = ({ role, user }) => `EXEC sp_addrolemember '${role}', '${user}';`;
const prepareGrantDbPermissionsQuery = ({ scope, user }) => `GRANT ${scope} TO ${user};`;
const prepareGrantTablePermissionsQuery = ({
  scope,
  db,
  table,
  user,
}) => `GRANT ${scope} ON ${db}.${table} TO ${user};`;

module.exports = {
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
};
