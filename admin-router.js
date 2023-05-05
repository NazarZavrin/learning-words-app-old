const express = require('express');
const adminRouter = express.Router();

let database;
let {connectToDb} = require("../connect-to-db.js");

adminRouter.use(async (req, res, next) => {
    let connectionResult = await connectToDb(req, res);
    if (typeof connectionResult === 'string') {
        res.send(connectionResult);
        return;
    } else {
        database = connectionResult.database;
        next();
    }
});
// {userId: "@admin"}
// adminRouter.get()