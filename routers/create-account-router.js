const express = require('express');
const createAccountRouter = express.Router();
const path = require('path');

// ↓ connecting to the database
let database;
let {connectToDb} = require("../connect-to-db.js");

createAccountRouter.use(async (req, res, next) => {
    // console.log(typeof connectToDb);
    // console.log(typeof database);
    let connectionResult = await connectToDb(req, res);
    if (typeof connectionResult === 'string') {
        res.send(connectionResult);
        return;
    } else {
        database = connectionResult.database;
        // console.log(typeof database);
        next();
    }
});

createAccountRouter.get("/", (req, res) => {
    // console.log("/create-account");
    res.sendFile(path.join(path.resolve(), 'pages', 'create-account.html'));
})
createAccountRouter.post("/:userId", async (req, res, next) => {
    // console.log("/create-account/:userId");
    // ↓ userId check
    let numOfDocsWithId = await database.collection("users").countDocuments({userId: req.params.userId});
    if (numOfDocsWithId !== 0) {
        res.send("This ID is already taken. Please, create another.");
        return;
    }
    next();
}, (req, res, next) => {
    express.json({
        limit: parseInt(req.get('content-length')),
        type: 'application/json',
    })(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    // ↓ email check
    let numOfDocsWithEmail = await database.collection("users").countDocuments({email: req.body.email});
    if (numOfDocsWithEmail !== 0) {
        res.send("User with such email already exists. Try to log in or provide another email.");
        return;
    }
    let insertResult = await database.collection("users").insertOne(req.body);
    console.log(insertResult);
    if (insertResult.acknowledged) {
        res.send("Success");
    } else {
        res.send("Server error. Failed to add user.");
    }
})

module.exports.createAccountRouter = createAccountRouter;