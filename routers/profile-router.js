const express = require('express');
const profileRouter = express.Router();

const { groupsRouter } = require('./groups-router.js');
const { wordsRouter } = require('./words-router.js');
// const path = require('path');
const { findIfUnique } = require('../useful-for-server.js');


let database;
let {connectToDb} = require("../connect-to-db.js");

profileRouter.use(async (req, res, next) => {
    // console.log(typeof connectToDb);
    // console.log(typeof database);
    let connectionResult = await connectToDb(req, res);
    if (typeof connectionResult === 'string') {
        res.send(connectionResult);
        return;
    } else {
        database = connectionResult;
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
    let cursor = database.collection("users").find({passkey: req.params.passkey});
    let result = await cursor.toArray();
    cursor.close();
    if (result.length === 1) {
        // res.send(result.pop());
        res.render("profile", {user: result.pop(), });
    } else {
        res.render("error", {
            message: "Log in error. Try again.", 
            linkText: "To the main page",
            divStyle: `font:20px"Calibri",monospace;margin-bottom:3px`
        });
    }
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
        let cursor = database.collection("users").find({passkey: req.params.passkey});
        let result = await cursor.toArray();
        cursor.close();
        if (result.length === 1) {
            let user = result[0];
            if (req.body.oldPassword === user.password) {
                req.body = req.body.newPassword;
            } else {
                res.json({success: false, message: "Old password don't match."});
                return;
            }
        } else {
            res.json({success: false});
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
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        let deleteResult = await database.collection("users").deleteOne({passkey: req.params.passkey});
        if (deleteResult.acknowledged) {
            deleteResult = await database.collection("groups").deleteMany({ownersObjectId: user._id});
            if (!deleteResult.acknowledged) {
                let error = {
                    message: "Could not delete groups after deletion of account.",
                    userObjectId: user._id,
                    time: Date.now(),
                };
                await database.collection("errors").insertOne(error);
            }
            res.json({success: true});
        } else {
            res.json({success: false});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {profileRouter};