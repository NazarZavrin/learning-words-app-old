const express = require('express');
const app = express();
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://nazar:learnwords@main-cluster.dlb856s.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const util = require('util');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
let database;
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'pages'));

async function getRandomHexStr(){
    let randomBytesPromise = util.promisify(crypto.randomBytes);
    let randomBuffer = await randomBytesPromise(16);
    return randomBuffer.toString('hex');
}

app.use(async (req, res, next) => {
    if (database === undefined) {
        try {
            await client.connect();
            database = client.db("userData");
        } catch (error) {
            console.log(error);
            await client.close();
            res.send("Database connection error.");
        }
    }
    next();
});

app.use(express.static(path.join(path.resolve(), 'pages')));

app.get("/create-account", (req, res) => {
    console.log("/create-account");
    res.sendFile(path.join(path.resolve(), 'pages', 'create-account.html'));
})
app.post("/create-account/:id", (req, res, next) => {
    // id check

    next();
}, (req, res, next) => {
    express.text({
        limit: parseInt(req.get('content-length')),
    })(req, res, next);
}, async (req, res) => {
    console.log("/create-account/:id");
    // name, email, id, password check
    let userData = JSON.parse(req.body);
    
    console.log(typeof database);
    let insertResult = await database.collection("users").insertOne(userData);
    console.log(insertResult);
    if (insertResult.acknowledged) {
        res.send("success");
    } else {
        res.send("fail");
    }
})

app.post("/get-log-in-key", (req, res, next) => {
    express.text({
        limit: req.get('content-length')
    })(req, res, next);
}, async (req, res) => {
    req.body = JSON.parse(req.body);
    let filter;
    if (req.body.email) {
        filter = { email: req.body.email };
    } else {
        filter = { id: req.body.id };
    }
    let user = await database.collection("users").findOne(filter);
    if (user.password === req.body.password) {
        let passkey = await getRandomHexStr();
        let updateResult = await database.collection("users").updateOne(filter, {$set: {"passkey": passkey}});
        if (updateResult.acknowledged) {
            res.send(passkey);
        } else {
            res.status(500).send("Failed to update document with passkey.");
        }
    } else {
        res.send("Wrong password");
    }
})

app.get("/profile/:passkey", async (req, res) => {
    let cursor = database.collection("users").find({passkey: req.params.passkey});
    let result = await cursor.toArray();
    cursor.close();
    if (result.length === 1) {
        res.send(result.pop());
    } else {
        res.status(500).send("Log in error. Try again.");
    }
})

app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})