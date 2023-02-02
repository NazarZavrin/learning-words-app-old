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
    if (user === false) {
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
    if (user === false) {
        res.json({success: false});
        return;
    }
    let cursor = database.collection("groups").find({ownersObjectId: user._id, isFavourite: gettingFavouriteGroups});
    let result = await cursor.project({_id: 0, name: 1}).toArray();
    cursor.close();
    // console.log(result);
    res.json({success: true, groups: result});
})

groupsRouter.get("/view/:groupName", async (req, res) => {
    // console.log(req.params.groupName);
    // console.log(req.passkey);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (user === false) {
        res.send("failure");
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.params.groupName});
    if (group === false) {
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
    let groupName = req.get("Group-Name");
    // console.log(groupName);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (user === false) {
        res.json({success: false});
        return;
    }
    let wordObject = {
        word: req.body.word,
        translation: req.body.translation,
        groupsName: groupName,
        ownersObjectId: user._id,
        creationTime: Date.now(),
    }
    let updateResult = await database.collection("groups").updateOne({ownersObjectId: user._id, name: groupName}, {$push: {words: wordObject}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json({success: true});
})
groupsRouter.get("/get-words", async (req, res) => {
    let groupName = req.get("Group-Name");
    // console.log(groupName);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: groupName});
    if (!groupName || group === false) {
        res.json({success: false});
        return;
    }
    let words = group?.words?.map(wordObject => {
        return {word: wordObject.word, translation: wordObject.translation,}
    })
    if (typeof words === "undefined") {
        words = [];
    }
    res.json({success: true, words: JSON.stringify(words)});
})

groupsRouter.patch("/change/:infoPart", (req, res, next) => {
    if (req.params.infoPart !== "status") {
        console.log("parsing body, infoPart = " + req.params.infoPart);
        express.json({limit: req.get("content-length")})(req, res, next);
    } else {
        next();
    }
}, async (req, res) => {
    let updateAction, updatedData;
    if (req.params.infoPart === "name") {
        if (!req.body.newGroupName) {
            res.json({success: false});
            return;
        }
        updateAction = {$set: {name: req.body.newGroupName}};
        updatedData = {newGroupName: req.body.newGroupName};
    }
    let groupName = req.get("Group-Name");
    // console.log(groupName);
    // console.log(req.body);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: groupName});
    if (!groupName || group === false) {
        res.json({success: false});
        return;
    }
    if (req.params.infoPart === "status") {
        updateAction = {$set: {isFavourite: !group.isFavourite}};
        updatedData = {groupIsFavoutite: !group.isFavourite};
    }
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, updateAction);
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json(Object.assign({success: true}, updatedData));
})

groupsRouter.delete("/delete", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    let groupName = req.get("Group-Name");
    // console.log(groupName);
    // console.log(req.body);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || !req.body.password || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: groupName});
    if (!groupName || group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        let deleteResult = await database.collection("groups").deleteOne({ownersObjectId: user._id, name: groupName});
        if (deleteResult.acknowledged) {
            res.json({success: true});
        } else {
            res.json({success: false});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {groupsRouter}
