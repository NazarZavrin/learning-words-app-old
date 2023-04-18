const express = require('express');
const groupsRouter = express.Router();
const {findIfUnique, getMaxFreeNumber, getMinFreeNumber} = require('../useful-for-server.js');

let database, session;
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
    session = client.startSession();// begin session
    try {
        const transactionResults = await session.withTransaction(async () => {// start transaction
            let insertResult = await database.collection("groups").insertOne(groupObject, {session: session});
            if (!insertResult.acknowledged) {
                throw new Error("Failed to add group to the DB.");
            }
            let updateResult = await database.collection("users").updateOne({_id: groupObject.ownersObjectId}, {$push: {groups: insertResult.insertedId}}, {session: session});
            if (!updateResult.acknowledged || !insertResult.insertedId) {
                throw new Error("Failed to add group's ObjectId to user.groups array after insertion of group to the DB.");
            }
        })
    } catch (error) {
        console.log("Error in transaction (group wasn't added to the DB and it's ObjectId wasn't added to user.groups array).");
        console.log(error);
        console.log("groupObject: " + JSON.stringify(groupObject));
        await session.endSession();// end session
        res.json({success: false});
        return;
    }
    await session.endSession();// end session
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

groupsRouter.propfind("/view", (req, res, next) => {
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
    let wordInfo = {
        word: req.body.word,
        translation: req.body.translation,
    }
    let suchWordExists = false, maxNumber = -1;
    for (let i = 0; i < group.words?.length; i++) {
        let currentWord = group.words[i];
        if (currentWord.word === wordInfo.word && currentWord.translation === wordInfo.translation) {
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
    let numberToSet = maxNumber > 0 ? Number.parseInt(maxNumber) + 1 : 1;
    // console.log(numberToSet);
    if (numberToSet > 99999.999) {// number must have 5 digits before the decimal point and 3 after it
        // console.log("getMaxFreeNumber");
        numberToSet = getMaxFreeNumber(group.words);
    }
    // console.log(numberToSet);
    if (numberToSet < 0) {
        // console.log("getMinFreeNumber");
        numberToSet = getMinFreeNumber(group.words);
        // console.log(numberToSet);
    }
    if (numberToSet < 0 || numberToSet > 99999.999) {
        res.json({success: false});
        return;
    }
    // console.log(numberToSet);
    Object.assign(wordInfo, { groupsObjectId: group._id, ownersObjectId: user._id, number: numberToSet, creationTime: Date.now(), });
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$push: {words: wordInfo}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    //console.log(numberToSet);
    res.json({success: true, number: numberToSet});
})
groupsRouter.propfind("/get-words", (req, res, next) => {
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
    let words = group?.words.map?.(wordInfo => {
        return {word: wordInfo.word, 
            translation: wordInfo.translation, 
            number: wordInfo.number,
            hideWord: wordInfo.hideWord,
            hideTranslation: wordInfo.hideTranslation,
        }
    })
    if (typeof words === "undefined") {
        words = [];
    }
    res.json({success: true, words: JSON.stringify(words), sortOrder: group.sortOrder});
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
groupsRouter.patch("/change/sort-order", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false || !req.body?.groupName || !req.body?.sortOrder) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.groupName});
    if (group === false) {
        res.json({success: false});
        return;
    }
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$set: {sortOrder: req.body.sortOrder}});
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.send({success: true});
})

groupsRouter.delete("/delete", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    // console.log(req.body);
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || !req.body.password || !req.body.groupName || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.groupName});
    if (group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        session = client.startSession();// begin session
        let errorDetails = {// details of a potential error
            userObjectId: user._id,
            groupObjectId: group._id,
            dateTimeUTC: new Date().toUTCString(),
        };
        try {
            const transactionResults = await session.withTransaction(async () => {// start transaction
                let deleteResult = await database.collection("groups").deleteOne({_id: group._id}, {session: session});
                if (!deleteResult.acknowledged) {
                    throw new Error("Failed to delete group from the DB.");
                };
                let updateResult = await database.collection("users").updateOne({_id: user._id}, {$pull: {groups: group._id}}, {session: session});
                if (!updateResult.acknowledged) {
                    throw new Error("Failed to remove group's ObjectId from user.groups array after deletion of group from the DB.");
                }
            })
        } catch (error) {
            console.log("Error in transaction (group wasn't deleted from the DB and it's ObjectId wasn't removed from user.groups array).");
            console.log(error);
            console.log("errorDetails: " + JSON.stringify(errorDetails));
            await database.collection("errors").insertOne({
                ...errorDetails,
                message: error.message,
            });
            await session.endSession();// end session
            res.json({success: false});
            return;
        }
        await session.endSession();// end session
        res.json({success: true});
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {groupsRouter};