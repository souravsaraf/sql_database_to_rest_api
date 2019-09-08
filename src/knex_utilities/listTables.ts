import Knex = require("knex");
export default function listTables(knex: Knex, schema_name: string)
{
    const selected_schema = schema_name || "public";
    let query: string = "";
    let bindings: string[] = [];

    switch (knex.client.constructor.name)
    {
        case "Client_MSSQL":
            query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${selected_schema}' AND table_catalog = ?`,
                bindings = [knex.client.database()];
            break;
        case "Client_MySQL":
        case "Client_MySQL2":
            query = "SELECT table_name FROM information_schema.tables WHERE table_schema = ?";
            bindings = [knex.client.database()];
            break;
        case "Client_Oracle":
        case "Client_Oracledb":
            query = "SELECT table_name FROM user_tables";
            break;
        case "Client_PG":
            query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${selected_schema}' AND table_catalog = ?`;
            bindings = [knex.client.database()];
            break;
        case "Client_SQLite3":
            query = "SELECT name AS table_name FROM sqlite_master WHERE type='table'";
            break;
    }
    return new Promise<string[]>((resolve, reject) =>
    {
        try
        {
            knex.raw(query, bindings).then((results) =>
            {
                // console.log("Result from listTables : ");
                resolve((results.rows.map((row: any) => row.table_name)) as string[]);
            });
        } catch (error)
        {
            reject("error in function listTables" + error);
        }
    });
}
