import express = require("express"); // Include express
import Knex from "knex";
import util = require("util");
import apis_to_generate from "./../../apis_to_generate.json";
import db_connection from "./../../db_connection.json";
import get_Tables_From_DB from "./../utilities/listTables";

/*
------------------------------------------  *  ------------------------------------

This file creates api's for database mentioned in the db_connection.json
Restricts the api to certain tables and columns as specified in apis_to_generate.json

------------------------------------------  *  ------------------------------------
*/

/*
    NO ORACLE SUPPORT : Please note that at the moment , this package does not support oracle 
    coz i wasnt able to get knex working with oracle.
*/

// Connect to database and get all schema information
let appData: { [k: string]: any } = {};
const knex: Knex = Knex(db_connection);

// our api schema
let schema_name = apis_to_generate.schema_name || "public";
console.log(`Schema name is : ${schema_name}`);

// set our api tables
let table_promise = get_Tables_Promise();

export = table_promise.then((table_promise_result: any) =>
{
    let tables = table_promise_result as string[];
    let col_promise_array: any[];
    col_promise_array = get_Columns_Promise(tables);
    Promise.all(col_promise_array).then((col_promise_result: any) =>
    {
        let col_result = col_promise_result;
        let router_promise = create_Routers_Promise(col_result);
    });
});

function get_Tables_Promise()
{
    let promise = new Promise((resolve, reject) =>
    {
        let all_tables_in_db: any = get_Tables_From_DB(knex, schema_name);
        // let all_tables_in_db: string[] = data.rows.map((x: any) => x.table_name);
        resolve(all_tables_in_db);
        reject("error in get_Tables_Promise");
    });
    return promise;
}

function get_Columns_Promise(tables_array: string[])
{
    let promise_array: any[] = [];
    for (let i: number = 1; i < tables_array.length; i++)
    {
        let current_table: string = tables_array[i];
        console.log(`Processing table ${current_table}`);
        let promise = new Promise((resolve, reject) =>
        {
            knex(current_table).columnInfo().then((data) =>
            {
                resolve(data);
            });
            reject("error in get_Columns_Promise");
        });
        promise_array.push(promise);
    }
    return promise_array;
}

function create_Routers_Promise(all: any)
{
    let tables: string[] = ["product", "router"];
    const router = express.Router();

    // Add a 'get' method to express router for our test route
    // GET host:port/api/v1
    router.get(`/`, (req, res) =>
    {
        res.send({ msg: `add /entity in the url to perform crud operations on that entity` });
    });

    for (let i: number = 1; i < tables.length; i++)
    {
        let current_table = tables[0];
        router.get(`/${current_table}`, (req, res) =>
        {
            res.send({ msg: `Get all ${current_table}s` });
            // console.log(`Route created for ${current_table}`);
        });
    }

    let promise = new Promise((resolve, reject) =>
    {
        resolve(router);
        reject("error in create_Routers_Promise");
    });

    return promise;
}
