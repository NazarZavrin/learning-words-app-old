const express = require('express');
const createAccountRouter = express.Router();
const path = require('path');

// ↓ connecting to the database
const { MongoClient, ServerApiVersion } = require('mongodb');
let database;
async function connectToDb(req, res, next) {
    // console.log("Connect to db if needed. URL: " + req.originalUrl);
    if (database === undefined) {
        let uri = "mongodb+srv://nazar:learnwords@main-cluster.dlb856s.mongodb.net/?retryWrites=true&w=majority";
        let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        try {
            await client.connect();
            database = client.db("userData");
            // console.log("Connected to the db.");
        } catch (error) {
            console.log(error);
            await client.close();
            res.send("Database connection error.");
        }
    }
    next();
}
createAccountRouter.use(connectToDb);

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