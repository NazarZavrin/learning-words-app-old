const express = require('express');
const app = express();
const path = require('path');
const util = require('util');
const crypto = require('crypto');
const { createAccountRouter } = require('./routers/create-account-router.js');
const { profileRouter } = require('./routers/profile-router.js');

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
app.use(connectToDb, express.static(path.join(path.resolve(), 'pages')));

const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));

app.use("/create-account", createAccountRouter);
app.use("/profile", profileRouter);

app.patch("/get-log-in-key", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
        type: 'application/json',
    })(req, res, next);
}, async (req, res) => {
    // req.body = JSON.parse(req.body);
    let filter;
    if (req.body.email) {
        filter = { email: req.body.email };
    } else {
        filter = { userId: req.body.userId };
    }
    // console.log(req.body);
    // console.log(filter);
    let cursor = database.collection("users").find(filter);
    let result = await cursor.toArray();
    cursor.close();
    // console.log(user);
    if (result.length === 0) {
        res.send("Wrong email or ID.");
        return;
    } else if (result.length > 1){
        res.send("Server error. Try to change log in info (from email to ID or conversely).");
        return;
    }
    let user = result[0];
    if (user.password === req.body.password) {
        let passkey = await getRandomHexStr();
        let updateResult = await database.collection("users").updateOne(filter, {$set: {"passkey": passkey}});
        if (updateResult.acknowledged) {
            res.send(passkey);
        } else {
            res.send("Failed to update document with passkey.");
        }
    } else {
        res.send("Wrong password.");
    }
})



app.all("/info", async (req, res) => {
    if (req.method === "GET") {
        res.sendFile(path.join(path.resolve(), 'pages', "db-table.html"));
    } else if (req.method === 'POST') {
        let cursor = database.collection('users').find();
        cursor = cursor.project({_id: 0, username: 1, email: 1, userId: 1, password: 1});
        let users = await cursor.toArray();
        cursor.close();
        res.send(JSON.stringify(users));
    } else {
        res.send('Wrong request method: "' + req.method.toUpperCase() + '".');
    }
});

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})

async function getRandomHexStr(){
    let randomBytesPromise = util.promisify(crypto.randomBytes);
    let randomBuffer = await randomBytesPromise(16);
    return randomBuffer.toString('hex');
}

// module.exports = {client, connectToDb};