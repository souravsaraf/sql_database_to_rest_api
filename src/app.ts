import bodyParser = require("body-parser"); // Include body-parser
import express = require("express"); // Include express
import { Router } from "express";
import generatedRouterPromise from "./generateRouters";

const app = express(); // This line simply puts Express in a variable called 'app'
app.use(bodyParser.urlencoded({ extended: true })); // Configure body-parser settings//
app.use(bodyParser.json()); // Parse json with body-parser

function loggerMiddleware(request: express.Request, response: express.Response, next: express.NextFunction)
{
  console.log(`${request.method} ${request.path}`);
  next();
}

function errorHandlerMiddleware(err: any, req: express.Request, res: express.Response, next: express.NextFunction)
{
  err.msg = err.stack;
  console.log(err);
  let output: any = {};
  output.status = "error";
  output.msg = err;
  res.status(500).send(output);
}

/**
 * 
 * @param cb : a (async) callback function which can return a promise or a response
 * @returns an express.js middleware function which takes 3 arguments(res , req , next) and
 *          either settles the response or calls next.
 */
// function asyncMiddleware(cb: Function)
// {
//   function f(req: express.Request, res: express.Response, next: express.NextFunction)
//   {
//     let promise = new Promise(function (resolve, reject)
//     {
//       // the function is executed automatically when the promise is constructed
//       let cbResult = cb(req, res, next);
//       resolve(cbResult);
//     });
//     promise.then((x) => x).catch((err) => next(err));
//   }
//   return f;
// }

app.use(loggerMiddleware);

const port: number = Number(process.env.PORT) || 3000;
console.log("port is " + port);

app.get("/", (req: express.Request, res: express.Response) =>
{
  res.send("Web server running");
});

console.log("generic router started");

generatedRouterPromise.then(
  (generatedRouter: Router) =>
  {
    console.log("generatedRouterPromise resolved");
    app.use("/api/v1/", generatedRouter);
    app.use(errorHandlerMiddleware);
    app.listen(port, (err: any) =>
    {
      if (err)
      {
        return console.error("App listen failed with : ", err);
      }
      return console.log("server is listening on " + port);
    });
  },
  (error) =>
  {
    console.log(`generatedRouterPromise rejected with : \n${error}`);
  },
).catch(
  (error) =>
  {
    console.error(error);
  },
);

console.log("generic router finished");
