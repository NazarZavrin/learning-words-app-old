const express = require('express');
const groupsRouter = express.Router();
const {findIfUnique} = require('../useful-for-server.js');

let database;
let {connectToDb} = require("../connect-to-db.js");

groupsRouter.use(async (req, res, next) => {
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

groupsRouter.post(/\/(favourite-groups)?/, (req, res, next) => {
    express.text({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    // let everythingIsOk = true;
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let groupObject = {
        name: req.body,
        ownersObjectId: user._id,
    }
    let numOfGroupsWithSuchName = await database.collection("groups").countDocuments(groupObject);
    if (numOfGroupsWithSuchName !== 0) {
        res.json({success: false, message: "Group with such name already exists."});
        return;
    }
    // console.log(req.method, req.url);
    let addingGroupToFavourites = req.url.includes("favourite-groups");
    Object.assign(groupObject, {isFavourite: addingGroupToFavourites, creationTime: Date.now(), });
    let insertResult = await database.collection("groups").insertOne(groupObject);
    if (!insertResult.acknowledged) {
        res.json({success: false});
        return;
    }
    let updateResult = await database.collection("users").updateOne({_id: groupObject.ownersObjectId}, {$push: {groups: insertResult.insertedId}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json({success: true});
})
groupsRouter.get(/^\/(favourite-groups)?$/, async (req, res) => {
    // console.log(req.passkey);
    // console.log("/view/buildings".match(/\/(favourite-groups)?/));
    // console.log(req.method, req.url);
    let gettingFavouriteGroups = req.url.includes("favourite-groups");
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let cursor = database.collection("groups").find({ownersObjectId: user._id, isFavourite: gettingFavouriteGroups});
    let result = await cursor.project({_id: 0, name: 1}).toArray();
    cursor.close();
    // console.log(result);
    res.json({success: true, groups: result});
})

groupsRouter.search("/view", (req, res, next) => {
    express.text({limit: req.get('content-length')})(req, res, next);
}, async (req, res) => {
    // console.log(req.passkey);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.send("failure");
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body});
    if (!req.body || group === false) {
        res.send("failure");
        return;
    }
    // console.log(result);
    res.render("view-group", {
        name: group.name,
        isFavourite: group.isFavourite,
    });
})
groupsRouter.put("/add-word", (req, res, next) => {
    express.json({limit: req.get('content-length')})(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    // console.log(req.passkey);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.groupName});
    if (!req.body.groupName || group === false) {
        res.json({success: false});
        return;
    }
    let wordObject = {
        word: req.body.word,
        translation: req.body.translation,
    }
    let suchWordExists = false, maxNumber = -1;
    for (let i = 0; i < group.words?.length; i++) {
        let currentWord = group.words[i];
        if (currentWord.word === wordObject.word && currentWord.translation === wordObject.translation) {
            suchWordExists = true;
            break;
        }
        if (currentWord.number > maxNumber) {
            maxNumber = currentWord.number;
        }
    }
    if (suchWordExists) {
        res.json({success: false, message: "Such word with such translation already exists."});
        return;
    }
    if (maxNumber < 0) {
        maxNumber = 0;
    }
    Object.assign(wordObject, { groupsObjectId: group._id, ownersObjectId: user._id, number: maxNumber + 1, creationTime: Date.now(), });
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$push: {words: wordObject}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json({success: true, number: maxNumber + 1});
})
groupsRouter.search("/get-words", (req, res, next) => {
    express.text({limit: req.get('content-length')})(req, res, next);
}, async (req, res) => {
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body});
    if (!req.body || group === false) {
        res.json({success: false});
        return;
    }
    let words = group?.words?.map(wordObject => {
        return {word: wordObject.word, translation: wordObject.translation, number: wordObject.number}
    })
    if (typeof words === "undefined") {
        words = [];
    }
    res.json({success: true, words: JSON.stringify(words)});
})
groupsRouter.patch("/change/name", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    if (!req.body.newGroupName) {
        res.json({success: false});
        return;
    }
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.oldGroupName});
    if (!req.body.oldGroupName || group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$set: {name: req.body.newGroupName}});
        if (updateResult.acknowledged) {
            res.json({success: true, newGroupName: req.body.newGroupName});
        } else {
            res.json({success: false});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})
groupsRouter.patch("/change/status", (req, res, next) => {
    express.text({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body});
    if (!req.body || group === false) {
        res.json({success: false});
        return;
    }
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$set: {isFavourite: !group.isFavourite}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json({success: true, groupIsFavoutite: !group.isFavourite});
})

groupsRouter.delete("/delete", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
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
        let deleteResult = await database.collection("groups").deleteOne({_id: group._id});
        if (deleteResult.acknowledged) {
            res.json({success: true});
        } else {
            res.json({success: false});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {groupsRouter};
