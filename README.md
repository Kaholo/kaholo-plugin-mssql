# kaholo-plugin-mssql
Kaholo Plugin for running scripts and queries on Microsoft SQL(MSSQL) server.

##  Settings
1. Connection String (Vault) **Required if not in method** - The connection string to use on default to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'

## Method: Execute Query
Execute an sql query on the connected SQL server.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Query String (Text) **Required** - The SQL query to execute.

## Method: Execute SQL File
Execute an sql script from a file on the agent.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. SQL File Path (String) **Required** - The path on the agent, of the file containing the SQL script to execute.

## Method: Test Connectivity
Test if can connect to the MSSQL server provided in the connection string.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'.

## Method: Get Tables Locks
Get all current locks on the specified table.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Database (Autocomplete) **Optional** - If specified, return information only on tables from this database.
3. Table (Autocomplete) **Optional** - If specified, return information only on the specified table.

## Method: Get Server Version
Return the version of the connected MSSQL server.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'

## Method: Get Databases Size
Return the size in MB of the specified database.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Database (Autocomplete) **Optional** - If specified, return only the size of the specified database.

## Method: Get Tables Size
Return the size in MB of the specified table.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Database (Autocomplete) **Optional** - If specified, return information only on tables from this database.
3. Table (Autocomplete) **Optional** - If specified, return information only on this table.

## Method: Create User
Create a new user. If provided role, or DB\Table Permission Scope also give the user the specified permissions or add to the specified role.
Runs everything in one transaction so if one command fails, no effects will take place in the DB.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Username (String) **Required** - The username to identify the new user by.
3. Password (Vault) **Required** - The password for the new user.
4. Role (Autocomplete) **Optional** - If specified assign the specified role to the new user.
5. DB Permission (Autocomplete) **Optional** - Database to give permissions on.
6. Database Permission Scope (Options) **Optional** - If specified grant the new user the specified scope of permissions in the above database. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Control - Can run commands to control all data inside existing tables.
* Alter - Can run all previous commands and all commands to alter the schema of the database, as in create new tables, editing existing tables and more.
* Full Access - Can run all possible commands on the specified database.
7. Table Permission (Autocomplete) **Optional** - Table to give permissions on.
8. Table Permission Scope (Options) **Optional** - If specified grant the new user the specified scope of permissions in the above table. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Full Access - Can run all possible commands on the specified table.

## Method: Grant Database Permissions
Grant Permission to the specified user on the specified database.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. User (Autocomplete) **Required** - The user to grant permission to
3. DB (Autocomplete) **Required** - The database to give permmision on.
4. Permission Scope (Options) **Required** - The scope of the permissions to give to the user. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Control - Can run commands to control all data inside existing tables.
* Alter - Can run all previous commands and all commands to alter the schema of the database, as in create new tables, editing existing tables and more.
* Full Access - Can run all possible commands on the specified database.


## Method: Grant Table Permissions
Grant Table Permissions

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. User (Autocomplete) **Required** - The user to grant permission to
3. DB (Autocomplete) **Required** - The database to select the table from.
4. Table (Autocomplete) **Required** - The table to give permission on.
5. Permission Scope (Options) **Required** - The scope of the permissions to give to the user.Possible values: [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Full Access - Can run all possible commands on the specified table.


## Method: Create Role
Create a new role in the connected database. Also grant permmission specified to the role.
Runs everything in one transaction so if one command fails, no effects will take place in the DB.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Role Name (String) **Required** - The name of the new role.
3. DB Permission (Autocomplete) **Optional** - Database to give permissions on.
4. Database Permission Scope (Options) **Optional** - If specified grant the new role the specified scope of permissions in the above database.[Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Control - Can run commands to control all data inside existing tables.
* Alter - Can run all previous commands and all commands to alter the schema of the database, as in create new tables, editing existing tables and more.
* Full Access - Can run all possible commands on the specified database.
5. Table Permission (Autocomplete) **Optional** - Table to give permissions on.
6. Table Permission Scope (Options) **Optional** - If specified grant the new role the specified scope of permissions in the above table. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT command
* Write/Update Only - Can run INSERT/UPDATE/DELETE commands.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE commands.
* Full Access - Can run all possible commands on the specified table.

## Method: Add Role Member
Add the specified user as a role member of the specified role, which gives him the same permissions as the specified role.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. User (Autocomplete) **Required** - The user to add as role member.
3. Role (Autocomplete) **Required** - The role to add a member to. Will grant the user all the permissions this role has.

## Method: List Databases
List all databases.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'

## Method: List Roles
List all roles in the connected database.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'

## Method: List Users
List all users in the connected database.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'

## Method: List Tables
List all tables in the specifed db.

## Parameters
1. Connection String (Vault) **Required if not in in settings** - The connection string to use to connect to the MSSQL server. Needs to follow the format 'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;'
2. Database (Autocomplete) **Optional** - The database to list its tables.