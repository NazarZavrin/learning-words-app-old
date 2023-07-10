const express = require('express');
const profileRouter = express.Router();

const { groupsRouter } = require('./groups-router.js');
const { wordsRouter } = require('./words-router.js');
// const path = require('path');
const { findIfUnique } = require('../useful-for-server.js');


let database, client;
let {connectToDb} = require("../connect-to-db.js");

profileRouter.use(async (req, res, next) => {
    // console.log(typeof connectToDb);
    // console.log(typeof database);
    let connectionResult = await connectToDb(req, res);
    if (typeof connectionResult === 'string') {
        res.send(connectionResult);
        return;
    } else {
        ({database, client} = connectionResult);
        // console.log(typeof database);
        next();
    }
});

profileRouter.use("/:passkey/groups", (req, res, next) => {
    req.passkey = req.params.passkey;
    next();
}, groupsRouter)
profileRouter.use("/:passkey/words", (req, res, next) => {
    req.passkey = req.params.passkey;
    next();
}, wordsRouter)

profileRouter.get("/:passkey", async (req, res) => {
    // console.log('profileRouter.get("/:passkey"', req.params.passkey.length);
    let userInfo = await findIfUnique(database.collection("users"), {passkey: req.params.passkey});
    if (!req.params.passkey || userInfo === false) {
        res.render("error", {
            message: "Log in error. Try again.", 
            linkText: "To the main page",
            divStyle: `font:20px"Calibri",monospace;margin-bottom:3px`
        });
        return;
    }
    let fileName = userInfo.userId === "@admin" ? "admin" : "profile";
    // ↑ if user - admin, then fileName will be "admin", else - "profile"
    res.render(fileName, {user: userInfo});
})
profileRouter.patch("/:passkey/change/:infoPart", (req, res, next) => {
    express.text({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    console.log(req.body);
    console.log(req.params.infoPart);
    // if infoPart is userId or email check if new value is unique
    if (req.params.infoPart === 'userId') {
        // ↓ userId check
        let numOfDocsWithId = await database.collection("users").countDocuments({userId: req.body});
        if (numOfDocsWithId !== 0) {
            res.json({success: false, message: "This ID is already taken. Please, provide another."});
            return;
        }
    } else if (req.params.infoPart === 'email') {
        // ↓ email check
        let numOfDocsWithEmail = await database.collection("users").countDocuments({email: req.body});
        if (numOfDocsWithEmail !== 0) {
            res.json({success: false, message: "User with such email already exists. Please, provide another email."});
            return;
        }
    } else if (req.params.infoPart === 'password') {
        req.body = JSON.parse(req.body);
        // ↓ old password check
        let user = await findIfUnique(database.collection("users"), {passkey: req.params.passkey});
        if (!req.params.passkey || user === false) {
            res.json({success: false});
            return;
        }
        if (req.body.oldPassword === user.password) {
            req.body = req.body.newPassword;
        } else {
            res.json({success: false, message: "Old password don't match."});
            return;
        }
    } else if (req.params.infoPart !== "username") {
        res.json({success: false, message: "Wrong characteristic: " + req.params.infoPart + "."});
        return;
    }
    let updateResult = await database.collection("users").updateOne({passkey: req.params.passkey}, {$set: {[req.params.infoPart]: req.body}});
    if (updateResult.acknowledged) {
        let responseObj = {success: true};
        if (req.params.infoPart !== 'password') {// don't send password to client
            responseObj.newValue = req.body;
        }
        res.json(responseObj);
    } else {
        res.json({success: false});
    }
})
profileRouter.delete("/:passkey/delete", (req, res, next) => {
    express.json({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    // ↓ password check
    let user = await findIfUnique(database.collection("users"), {passkey: req.params.passkey});
    if (!req.params.passkey || user === false) {
        res.json({success: false, message: "Server error1"});
        return;
    }
    if (req.body.password === user.password) {
        let session = client.startSession();// begin session
        let errorDetails = {// details of a potential error
            userObjectId: user._id,
            dateTimeUTC: new Date().toUTCString(),
        };
        try {
            const transactionResults = await session.withTransaction(async () => {// start transaction
                let deleteResult = await database.collection("users").deleteOne({passkey: req.params.passkey}, {session: session});
                if (!deleteResult.acknowledged) {
                    throw new Error("Failed to delete user from the DB.");
                };
                deleteResult = await database.collection("groups").deleteMany({ownersObjectId: user._id}, {session: session});
                if (!deleteResult.acknowledged) {
                    throw new Error("Failed to delete user's groups from the DB after deletion of the account.");
                }
            })
        } catch (error) {
            console.log("Error in transaction (user and his groups weren't deleted from the DB).");
            console.log(error);
            console.log("errorDetails: " + JSON.stringify(errorDetails));
            await database.collection("errors").insertOne({
                ...errorDetails,
                message: error.message,
            });
            await session.endSession();// end session
            res.json({success: false, message: "Server error"});
            return;
        }
        await session.endSession();// end session
        res.json({success: true});
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {profileRouter};