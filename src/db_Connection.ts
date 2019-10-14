import Knex from "knex";
import db_Connection_Details from "./config/db_connection.json";
const knex: Knex = Knex(db_Connection_Details);
export = knex;
