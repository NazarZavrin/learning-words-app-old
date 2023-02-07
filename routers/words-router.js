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
wordsRouter.patch("/change", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    console.log(req.body);
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
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, 
            {$set: {"words.$[elem].word": req.body.newWord.word, "words.$[elem].translation": req.body.newWord.translation}}, 
            {arrayFilters: [{"elem.word": req.body.oldWord.word, "elem.translation": req.body.oldWord.translation}]});
        if (!updateResult.acknowledged || !req.body.newWord.word || !req.body.newWord.translation || !req.body.oldWord.word || !req.body.oldWord.translation) {
            res.json({success: false});
        } else {
            res.json({success: true, newWord: req.body.newWord.word, newTranslation: req.body.newWord.translation});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})
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
        if (!updateResult.acknowledged || !req.body.word || !req.body.translation) {
            res.json({success: false});
        } else {
            res.json({success: true});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {wordsRouter};