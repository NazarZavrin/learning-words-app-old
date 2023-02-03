const express = require('express');
const wordsRouter = express.Router();
const {findIfUnique} = require('../useful-for-server.js');

let database;
let {connectToDb} = require("../connect-to-db.js");

wordsRouter.use(async (req, res, next) => {
    let connectionResult = await connectToDb(req, res);
    if (typeof connectionResult === 'string') {
        res.send(connectionResult);
        return;
    } else {
        database = connectionResult;
        next();
    }
});

wordsRouter.delete("/delete", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || !req.body.password || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.groupName});
    if (!req.body.groupName || group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        // console.log(req.body);
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$pull: {words: {word: req.body.word, translation: req.body.translation}}});
        if (!updateResult.acknowledged) {
            res.json({success: false});
            return;
        } else {
            res.json({success: true});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {wordsRouter};