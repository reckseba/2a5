#!/usr/bin/env bash
set -e


# mind the syntax around the database_app_password where the colon comes before the singe quotes.

psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres -v database_app_username="$DATABASE_APP_USERNAME" -v database_app_password="$DATABASE_APP_PASSWORD" -v database_orm_username="$DATABASE_ORM_USERNAME" -v database_orm_password="$DATABASE_ORM_PASSWORD" -v database_name="$DATABASE_NAME"<<-EOSQL
    CREATE DATABASE :database_name;

    -- default privileges granted to PUBLIC are as follows: CONNECT and TEMPORARY (create temporary tables) privileges for databases
    REVOKE ALL ON DATABASE :database_name FROM PUBLIC;

    \connect :database_name

    -- least privilege: schema shall not be owned by the superuser
    CREATE ROLE schema_owner;
    CREATE SCHEMA appschema AUTHORIZATION schema_owner;

    -- create read update without delete role with NOLOGIN for app
    CREATE USER :database_app_username WITH PASSWORD :'database_app_password';

    -- create role with NOLOGIN for orm
    CREATE USER :database_orm_username WITH PASSWORD :'database_orm_password';

    -- both shall be able to connect to the database
    GRANT CONNECT ON DATABASE :database_name TO :database_app_username, :database_orm_username;

    -- both shall be able to access the schema inside the database
    GRANT USAGE ON SCHEMA appschema TO :database_app_username, :database_orm_username;

    -- but only the orm role neads privileges to create objects
    GRANT CREATE ON SCHEMA appschema TO :database_orm_username;

    -- object created by the orm role shall have all permissions
    ALTER DEFAULT PRIVILEGES FOR ROLE :database_orm_username IN SCHEMA appschema GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :database_orm_username;

    -- objects created by the orm role shall be accessable (create, read, update) by the app role
    ALTER DEFAULT PRIVILEGES FOR ROLE :database_orm_username IN SCHEMA appschema GRANT SELECT, INSERT, UPDATE ON TABLES TO :database_app_username;

    -- both users shall be able to use sequences on objects created by the orm
    ALTER DEFAULT PRIVILEGES FOR ROLE :database_orm_username IN SCHEMA appschema GRANT USAGE ON SEQUENCES TO :database_app_username, :database_orm_username;

EOSQL

