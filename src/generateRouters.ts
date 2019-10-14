import express = require("express"); // Include express
import dbModelPromise from "./generateDbModel";
import generateTableRouter from "./routes/tableRouter";

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

// create and export generated express routers
let router_promise = generate_All_Routers_Async();
export = router_promise;

async function generate_All_Routers_Async()
{
    try
    {
        let apiRouter = express.Router();
        let dbModel = await dbModelPromise;
        dbModel.table_info.map((table_info: any) =>
        {
            let tableRouter = generateTableRouter(dbModel.schema_name, table_info);
            apiRouter.use("/", tableRouter);
        });
        return apiRouter;
    } catch (error)
    {
        console.error("Error occured in function generate_All_Routers_Async : " + error);
        throw error;
    }
}
