import apis_to_generate from "./config/apis_to_generate.json";
import knex from "./db_Connection";
import * as _ from "lodash";
import get_Tables_From_DB_Async from "./knex_utilities/listTables";

// This file creates a model for the underlying database which will be used to generate the apis.

// Connect to database and get all schema information
let appData: { [k: string]: any } = {};

// our api schema
let schema_name = apis_to_generate.schema_name || "public";
console.log(`Schema name is : ${schema_name}`);
appData.schema_name = schema_name;

// create and export generated express routers
let dbModelPromise = generate_DB_Model_Async();
export = dbModelPromise;

async function generate_DB_Model_Async()
{
    try
    {
        // READ list of tables from Database
        appData.table_info = [];
        let tablesInDb: string[] = await get_Tables_From_DB_Async(knex, schema_name);
        console.log(`\nList of tables present in DB : ${tablesInDb.sort().join(", ")}`);

        let tablesRequiredByUser: string[] = apis_to_generate.table_info.map((ti) => ti.table_name);
        console.log(`List of tables whose Api is required by User : ${tablesRequiredByUser.sort().join(", ")}`);

        let tablesForApi: string[] = _.intersection(tablesInDb, tablesRequiredByUser);
        console.log(`List of tables whose Api will be created : ${tablesForApi.sort().join(", ")}`);

        tablesForApi.map((ta: string) =>
        {
            let obj: any = {};
            obj.table_name = ta;
            appData.table_info.push(obj);
        });

        // Get all column info for all the tables
        let results = await Promise.all(tablesForApi.map((t: string) => get_Columns_For_Table_Async(t)));
        console.log(`\nDatabase model generated = \n${JSON.stringify(appData, null, 4)}`);
        return appData;
    } catch (error)
    {
        console.error("Error occured in function createRoutersAsync : " + error);
        throw error;
    }
}

async function get_Columns_For_Table_Async(current_table: string)
{
    try
    {
        // Read list of columns for a table
        let colData: any = await knex(current_table).withSchema(schema_name).columnInfo();
        let columnsInDB: string[] = Object.keys(colData);
        console.log(`\nFor table ${current_table} , List of columns in DB : ${columnsInDB.sort().join(", ")}`);

        let columnsRequiredByUser = (apis_to_generate.table_info.find((val) => val.table_name === current_table) as { [k: string]: any }).columns;
        console.log(`For table ${current_table} , List of columns required by user : ${columnsRequiredByUser.sort().join(", ")}`);

        let columnsForApi: string[] = _.intersection(columnsInDB, columnsRequiredByUser);
        console.log(`For table ${current_table} , List of columns filters in the api : ${columnsForApi.sort().join(", ")}`);

        // Primary key column MUST be a part of the api
        let keyByUser = (apis_to_generate.table_info.find((val) => val.table_name === current_table) as { [k: string]: any }).key;
        if (!columnsForApi.includes(keyByUser))
        {
            // Invalid Primary key , drop the table fromm api generation
            let index = appData.table_info.findIndex((t: any) => t.table_name === current_table);
            appData.table_info.splice(index, 1);
            console.log(`\nFor table ${current_table} , primary key column "${keyByUser}" column not found. Removing this table.`);
        }
        else
        {
            // Valid Primary key , add this info
            let column_info: any = [];
            columnsForApi.map((col) =>
            {
                let column: { [k: string]: any } = {};
                column.column_name = col;
                column.type = (colData as { [k: string]: any })[col].type;
                column_info.push(column);
            });
            appData.table_info.find((t: any) => t.table_name === current_table).column_info = column_info;
            appData.table_info.find((t: any) => t.table_name === current_table).key = keyByUser;

        }
        return (colData);
    } catch (error)
    {
        console.log("error in get_Columns_For_Table_Async : " + error.toString());
        throw (error);
    }
}
