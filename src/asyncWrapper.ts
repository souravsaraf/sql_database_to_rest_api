import express = require("express");
const asyncWrapper = function (fn: express.RequestHandler)
{
    // tslint:disable-next-line: no-unused-expression
    return (function x(req: express.Request, res: express.Response, next: express.NextFunction)
    {
        Promise.resolve(fn(req, res, next)).catch(next);
    });
};

export = asyncWrapper;
