import bodyParser = require("body-parser"); // Include body-parser
import express = require("express"); // Include express
import generateRouterPromise from "./api/routes/tableRouter";

const app = express(); // This line simply puts Express in a variable called 'app'
app.use(bodyParser.urlencoded({ extended: true })); // Configure body-parser settings//
app.use(bodyParser.json()); // Parse json with body-parser

function loggerMiddleware(request: express.Request, response: express.Response, next: express.NextFunction)
{
  console.log(`${request.method} ${request.path}`);
  next();
}

app.use(loggerMiddleware);

const port: number = Number(process.env.PORT) || 3000;
console.log("port is " + port);

app.get("/", (req: express.Request, res: express.Response) =>
{
  res.send("Web server running");
});

generateRouterPromise.then((gen_router: any) =>
{
  app.use("/api/v1/", gen_router);
},
  (err: any) => { console.log(err); }
);

app.listen(port, (err: express.Errback) =>
{
  if (err)
  {
    return console.error(err);
  }
  return console.log("server is listening on " + port);
});
