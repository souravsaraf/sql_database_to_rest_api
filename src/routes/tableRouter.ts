import express = require("express");
import * as _ from "lodash";
import knex from "../db_Connection";
import asyncWrap from "./../asyncWrapper";

export default function generateTableRouter(schema_name: string, table_info: any)
{
    let router: express.Router = express.Router();
    let current_table = table_info.table_name;
    let full_table_name = schema_name + "." + current_table;
    let columns = table_info.column_info.map((x: any) => x.column_name) as string[];
    let pk_column = table_info.key;

    // GET /entitiy OR GET /entitiy?k1=v1&k2=v2...
    // returns a json array of entities with or without search criteria.
    router.get(`/${current_table}`, asyncWrap(async (req, res, next) =>
    {
        if (Object.keys(req.query).length === 0)
        {
            let rows: any = await knex.select().table(full_table_name);
            res.send(rows);
        }
        else
        {
            res.send({ msg: `Get ${current_table}s with criteria ${JSON.stringify(req.query)}` });
        }
    }));

    // GET /entitiy/:id
    // reads entity with filter on primary key id and returns the entity as json.
    router.get(`/${current_table}/:id`, asyncWrap(async (req, res, next) =>
    {
        let id = req.params.id;
        let rows: any = await knex.select().table(full_table_name).where(pk_column, id);
        res.send(rows);
    }));

    // POST /entitiy/
    // inserts an entity in the table and returns status as json.
    router.post(`/${current_table}`, asyncWrap(async (req, res, next) =>
    {
        let inputJson = req.body;
        if (inputJson instanceof Array)
        {
            let rowsToInsert = inputJson as any[];
            let rows: any = await knex(full_table_name).insert(rowsToInsert);
            let output: any = {};
            output.status = "success";
            output.msg = `inserted ${rows.rowCount} records`;
            res.send(output);
        }
        else
        {
            let output: any = {};
            output.status = "error";
            output.msg = `Invalid input json. Input must be an array of ${current_table}s.`;
            res.send(output);
        }
    }));

    // PUT /entitiy/:id
    // updates the given attributes of entity with id and returns status as json.
    router.put(`/${current_table}/:id`, asyncWrap(async (req, res, next) =>
    {
        let inputJson = req.body;
        let id = req.params.id;
        let rows: any = await knex(full_table_name).where(pk_column, id).update(inputJson);
        let output: any = {};
        output.status = "success";
        output.msg = `updated ${rows} records`;
        res.send(output);
    }));

    // DELETE /entitiy/:id
    // deletes the entity with id and returns status as json.
    router.delete(`/${current_table}/:id`, asyncWrap(async (req, res, next) =>
    {
        let id = req.params.id;
        let rows: any = await knex(full_table_name).where(pk_column, id).del();
        let output: any = {};
        output.status = "success";
        output.msg = `deleted ${rows} records`;
        res.send(output);
    }));

    return router;
}
