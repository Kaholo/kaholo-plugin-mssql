# Kaholo MS SQL Server Plugin
Microsoft SQL Server is a relational database management system (RDBMS) that supports a wide variety of transaction processing, business intelligence and analytics applications in corporate IT environments.

This plugin extends Kaholo's capability to include running scripts and queries on a Microsoft SQL Server.

## Plugin Account
Plugin Settings and Accounts are accessed in Kaholo by clicking on Settings | Plugins, and then clicking on the name of the plugin, which is a blue hyperlink. The Microsoft SQL Server plugin has no settings, but uses Kaholo Accounts to manage the connection string and password. This is for convenience and security. Once a default account is configured all new plugin actions will automatically inherit its parameters, so the same authentication details are pre-configured for each action of the plugin. If multiple accounts are configured, at the Action level parameter Account is a drop-down list of accounts from which to select. At least one account must be created to use the plugin.

The plugin account can also be created at the Action level by selecting "Add New Plugin Account" from the drop-down menu for parameter "Account". The Account parameter appears only after selecting a method that requires the account.

### Account Parameter: Host
The hostname or IP address of the Microsoft SQL Server. If using hostname, it must be resolvable from the Kaholo agent, e.g. via DNS or by adding it to /etc/hosts on the agent using the [Text Editor plugin](https://github.com/Kaholo/kaholo-plugin-text-editor).

### Account Parameter: Username
The username for authentication with the Microsoft SQL Server. For SQL Server Authentication this is a simple user name. For Windows Authentication use the format `<domainName>\<loginName>`, for example myuser@kaholo.io my use `KAHOLO\myuser` as user name.

### Account Parameter: Password
The password that is associated with the user name specified. To prevent exposure of the password in the user interface, logs, error messages and such, the password is stored in the Kaholo Vault. This may be done in Settings | Vault before creating an account or by using the "Add New Vault Item" in the drop-down for this parameter while creating a new plugin account.

### Account Parameter: Additional Connection String Items
The other parameters will be combined by the plugin into a SQL Server connection string, for example:

    Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;

Often it is necessary to include additional connection items in the connection string, for example if the TLS certificate of the server cannot be verified because it is only a temporary test system with a self-signed certificate, it may be necessary to add `TrustServerCertificate=true`. To select a specific database as part of the connection string, one might use `Database=mydatabase`. These additional connection string items can be provided here one-per-line without semicolons, e.g.:

    TrustServerCertificate=true
    Database=mydatabase

## Method: Execute Query
Executes an SQL/T-SQL query on the connected SQL server.

### Parameter: Query String
The SQL/T-SQL query to execute.

## Method: Execute SQL File
Executes an SQL/T-SQL query text file. The file must be on the Kaholo agent's file system. This is normally accomplished by use of the [Git Plugin](https://github.com/Kaholo/kaholo-plugin-git) by cloning a repository or it may be written to the agent using the [Text Editor Plugin](https://github.com/Kaholo/kaholo-plugin-text-editor), or as output of an upstream action in the pipeline.

### Parameter: SQL File Path
The path to the file, either relative or absolute on the Kaholo agent. Relative paths are from the default working directory on the Kaholo agent, for example `/twiddlebug/workspace`.

## Method: Test Connectivity
This method has no parameters and simply establishes a connection with the SQL Server as a test that the Kaholo Plugin Account is correctly configured and the SQL Server is accessible on the network.

## Method: Get Table Locks
Gets information about locks on tables. Locks are put on tables to prevent concurrent use by different transactions. Use this method to discover which locks exist and get information about the processes that created them. By default the method gets all locks from a database.

### Parameter: Database
If a database is already specified as part of the Additional Connection String Items in the Kaholo Plugin Account, this parameter may be left empty. Otherwise, select a database from which to get table locks.

### Parameter: Table
Select a specific table to get locks only on that table. Otherwise select "All" or leave unconfigured to get all table locks in the database.

## Method: Get Server Version
This method returns the version information of the server to which it connects. There are no configurable parameters for this method beyond the Kaholo Plugin Account, which forms the basis for the connection string.

## Method: Get Database Size
Gets the size in MB of database(s). If no database is selected the size of all databases is retrieved.

### Parameter: Database
To get the size of only the specified database, select a database using the drop-down autocomplete. To get the size of all databases in the server, select "All" or leave this parameter unconfigured.

## Method: Get Table Size
Gets the size in MB of table(s) in a database.

### Parameter: Database
Select the database from which to get table sizes.

### Parameter: Table
To get the size of only the specified table, select a table using the drop-down autocomplete. To get the size of all tables in the database, select "All" or leave this parameter unconfigured.

## Method: Create User
Create SQL Server Authenticated User with Login. It does not create Windows authenticated users or those without login or new users for existing logins. If provided a role the method also gives the user the specified role. The method runs as a single transaction so if any part fails, no changes take effect.

### Parameter: Username
The name of the user to create.

### Parameter: Password
A password for the new user. The password must first be entered as an item in the Kaholo Vault to protect it from exposure in the user interface, activity log, error messages, etc.

### Parameter: Role
The role to assign the new user. Use the autocomplete to select from among the available roles.

### Parameter: Database
The database on which to grant permissions. Use the autocomplete to select a database.

### Parameter: Database Permission Scope
If specified grant the new user this scope of permissions in the database. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run only SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Control - Can run queries to control all data inside existing tables.
* Alter - Can run all previous queries and those that alter the schema of the database.
* Full Access - Can run all queries on the specified database.

### Parameter: Table
If specified, a table on which to grant permissions. Use the autocomplete to select a table.

### Parameter: Table Permission Scope
If specified grant the new user this scope of permissions in the table. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Full Access - Can run all queries on the specified table.

## Method: Grant Database Permissions
Grant specified permissions to an existing user over an existing database.

### Parameter: User
The user to be granted the specified permissions.

### Parameter: Database
The database on which to grant permissions. Use the autocomplete to select a database.

### Parameter: Permission Scope
Grant the user this scope of permissions in the database. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run only SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Control - Can run queries to control all data inside existing tables.
* Alter - Can run all previous queries and those that alter the schema of the database.
* Full Access - Can run all queries on the specified database.

## Method: Grant Table Permissions
Grant specified permissions to an existing user over the specified table.

### Parameter: User
The user to be granted the specified permissions.

### Parameter: Database
The database to which the table belongs. Use the autocomplete to select a database.

### Parameter: Table
The table on which to grant permissions to the specified user.

### Parameter: Permission Scope
Grant the user this scope of permissions in the table. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Full Access - Can run all queries on the specified table.

## Method: Create Role
Creates a new role in the database schema.

### Parameter: Role Name
A name for the new role.

### Parameter: Database
The database in which to create the new role. Use the autocomplete to select a database.

### Parameter: Database Permission Scope
Grant the user this scope of permissions in the database. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-database-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run only SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Control - Can run queries to control all data inside existing tables.
* Alter - Can run all previous queries and those that alter the schema of the database.
* Full Access - Can run all queries on the specified database.

### Parameter: Table
If specified, a table on which to grant permissions. Use the autocomplete to select a table.

### Parameter: Table Permission Scope
If specified grant the user this scope of permissions in the table. [Read more here](https://docs.microsoft.com/en-us/sql/t-sql/statements/grant-object-permissions-transact-sql?view=sql-server-ver15#remarks). Possible values are: 
* Read Only - Can run SELECT queries.
* Write/Update Only - Can run INSERT/UPDATE/DELETE queries.
* Read And Write - Can run SELECT/INSERT/UPDATE/DELETE queries.
* Full Access - Can run all queries on the specified table.

## Method: Add Role Member
Adds an existing user to an existing role. This is a way to group users by role and then assign permissions according to the roles, rather than assigning permissions directly to specific users.

### Parameter: User
The user to be added to the role.

### Parameter: Role
The role to which the user will be added.

## Method: List Databases
Lists all databases visible based on the connection credentials provided in the Kaholo Plugin Account.

## Method: List Roles
Lists all roles visible based on the connection credentials provided in the Kaholo Plugin Account.

## Method: List Users
Lists all users visible based on the connection credentials provided in the Kaholo Plugin Account.

## Method: List Tables
Lists all tables visible in a database based on the connection credentials provided in the Kaholo Plugin Account.

### Parameter: Database
The database for which to list tables. Select a database from the drop-down autocomplete list.
