import express = require("express"); // Include express
import * as fs from "fs";
import Knex from "knex";
import * as path from "path";
import apis_to_generate from "./config/apis_to_generate.json";
import db_connection from "./config/db_connection.json";
import get_Tables_From_DB_Async from "./knex_utilities/listTables";
import productRouter from "./routes/product";

/*
------------------------------------------  *  ------------------------------------

This file creates api's (express routers) for CRUD operations on database tables.
The config file "db_connection.json" contains the database connection details.
It will create a router for each table.
Another config file "apis_to_generate.json" restricts the api to certain tables and columns.

------------------------------------------  *  ------------------------------------
*/

/*
    NO ORACLE SUPPORT : Please note that at the moment , this package does not support Oracle,
    coz I wasn't able to get knex working with Oracle.
*/

// Connect to database and get all schema information
let appData: { [k: string]: any } = {};
const knex: Knex = Knex(db_connection);

// our api schema
let schema_name = apis_to_generate.schema_name || "public";
console.log(`Schema name is : ${schema_name}`);
appData.schema_name = schema_name;

// create and export generated express routers
let router_promise = generate_All_Routers_Async();
export = router_promise;

async function generate_All_Routers_Async()
{
    try
    {
        // READ list of tables from Database
        appData.table_info = [];
        let tablesInDb: string[] = await get_Tables_From_DB_Async(knex, schema_name);
        console.log(`\nList of tables present in DB : ${tablesInDb.sort().join(", ")}`);

        let tablesRequiredByUser: string[] = apis_to_generate.table_info.map((ti) => ti.table_name);
        console.log(`List of tables whose Api is required by User : ${tablesRequiredByUser.sort().join(", ")}`);

        let tablesForApi: string[] = tablesInDb.filter((t) => tablesRequiredByUser.includes(t));
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
        fs.writeFileSync(path.join(__dirname, "config", "app_generated_models.json"), JSON.stringify(appData, null, 4));

        let routers = await create_Routers_Promise();
        return routers;
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

        let columnsForApi: string[] = columnsInDB.filter((t) => columnsRequiredByUser.includes(t));
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

function create_Routers_Promise()
{
    // let tables: string[] = ["order"];
    // const router: express.Router = express.Router();

    // // Add a 'get' method to express router for our test route
    // // GET host:port/api/v1
    // router.get(`/`, (req, res) =>
    // {
    //     res.send({ msg: `add /entity in the url to perform CRUD operations on that entity` });
    // });

    // for (let i: number = 0; i < tables.length; i++)
    // {
    //     let current_table = tables[i];
    //     router.get(`/${current_table}`, (req, res) =>
    //     {
    //         res.send({ msg: `Get all ${current_table}s` });
    //         // console.log(`Route created for ${current_table}`);
    //     });
    // }

    let promise = new Promise<express.Router>((resolve, reject) =>
    {
        resolve(productRouter);
        reject("error in create_Routers_Promise");
    });

    return promise;
}
