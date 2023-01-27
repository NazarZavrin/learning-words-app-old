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
    console.log(req.body);
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

module.exports = {groupsRouter}
