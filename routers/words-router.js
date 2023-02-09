const express = require('express');
const wordsRouter = express.Router();
const {findIfUnique, getMinFreeNumber} = require('../useful-for-server.js');

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
    if (!req.body.groupName || !req.body.newWord.word || !req.body.newWord.translation || !req.body.oldWord.word || !req.body.oldWord.translation || group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        // console.log(req.body);
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, 
            {$set: {"words.$[elem].word": req.body.newWord.word, "words.$[elem].translation": req.body.newWord.translation}}, 
            {arrayFilters: [{"elem.word": req.body.oldWord.word, "elem.translation": req.body.oldWord.translation}]});
        if (!updateResult.acknowledged) {
            res.json({success: false});
        } else {
            res.json({success: true, newWord: req.body.newWord.word, newTranslation: req.body.newWord.translation});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})
wordsRouter.patch("/change-number", (req, res, next) => {
    express.json({limit: req.get("content-length")})(req, res, next);
}, async (req, res) => {
    let user = await findIfUnique(database.collection("users"), {passkey: req.passkey});
    if (!req.passkey || user === false) {
        res.json({success: false});
        return;
    }
    let group = await findIfUnique(database.collection("groups"), {ownersObjectId: user._id, name: req.body.groupName});
    if (!req.body.groupName || !req.body.word || !req.body.translation || group === false) {
        res.json({success: false});
        return;
    }
    let newNumber = getNormalNumber(req.get("New-Number"));
    if (Number.isNaN(newNumber)) {
        res.json({success: false});
        return;
    }
    // console.log("-----");
    // group.words.forEach(wordObj => {
    //     console.log(wordObj.word, wordObj.number);
    // });
    let result = group.words.find((word) => word.number === newNumber);
    // console.log("newNumber", newNumber);
    // console.log("word.number === newNumber", result);
    if (result) {// if some word already has number = newNumber
        // Task №1: find minimal free number after newNumber
        let minFreeNumber = getMinFreeNumber(group.words, newNumber);// minFreeNumber = minimal free number after newNumber
        minFreeNumber = minFreeNumber <= 0 ? 99999.999 : minFreeNumber;// if getMinFreeNumber() returned < 0, minFreeNumber = 99999.999
        // console.log("minFreeNumber", minFreeNumber);
        // Task №2: increasing by 0.001 word's numbers that are greater than newNumber but less then minFreeNumber
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, 
        {$inc: {"words.$[element].number": 0.001}},
        {arrayFilters: [{"element.number": {$gte: newNumber, $lte: minFreeNumber}}]});
        if (!updateResult.acknowledged) {
            res.json({success: false});
            return;
        }
        // Task №3: fix numbers which have decimal part's length greater than 3 after increase
        // getting all words of group
        let cursor = await database.collection("groups").find({_id: group._id});// 99999.999
        let result = await cursor.project({_id: 0, words: 1}).toArray();
        cursor.close();
        result = result[0].words;
        // finding words that have decimal part's length greater than 3
        let wordsWithLongDecimals = result.filter(wordObj => String(wordObj.number).split(".")[1]?.length > 3);
        // console.log("long", wordsWithLongDecimals);
        // fixing decimal parts
        for (let i = 0; i < wordsWithLongDecimals?.length; i++) {
            console.log("fix: oldNumber", wordsWithLongDecimals[i].number, wordsWithLongDecimals[i].word);
            updateResult = await database.collection("groups").updateOne({_id: group._id}, 
                {$set: {"words.$[element].number": +wordsWithLongDecimals[i].number.toFixed(3)}},
                {arrayFilters: [{"element.number": wordsWithLongDecimals[i].number}]});
            console.log("newNumber", +wordsWithLongDecimals[i].number.toFixed(3));
        }
        // Task №4: find words with numbers that are greater than 99999.999 and push them in the beginning
        // getting group if it has word(s) with number(s) greater than 99999.999
        cursor = await database.collection("groups").find({_id: group._id, "words.number": {$gt: 99999.999}});
        result = await cursor.toArray();
        cursor.close();
        if (result?.length !== 0) {// if there is at least one group which has word(s) with number(s) greater than 99999.999
            let wordsArray = result[0].words;
            let wordsWithBigNumbers = wordsArray.filter((wordObj) => {// finding words with numbers that are greater than 99999.999
                // console.log("value", value, );
                if (wordObj.number > 99999.999) {
                    // console.log(wordObj.word, wordObj.number);
                    return true;
                } else {
                    return false;
                }
            });
            // console.log("wordsWithBigNumbers", wordsWithBigNumbers);
            // pushing words with numbers that are greater than 99999.999 in the beginning
            for (let i = 0; i < wordsWithBigNumbers?.length; i++) {
                let minFreeNumber = getMinFreeNumber(wordsArray);
                minFreeNumber = minFreeNumber <= 0 ? 99999.999 : minFreeNumber;// if getMinFreeNumber() returned < 0, minFreeNumber = 99999.999
                // console.log("minFreeNumber", minFreeNumber);
                // console.log("wordWithBigNumber", wordsWithBigNumbers[i]);
                updateResult = await database.collection("groups").updateOne({_id: group._id}, 
                    {$set: {"words.$[element].number": minFreeNumber}},
                    {arrayFilters: [{"element.number": wordsWithBigNumbers[i].number}]});
                wordsArray.push({number: minFreeNumber});// to forbid getMinFreeNumber generate same number again
                // console.log("push", wordsArray.slice(-2));
                
            }
        }
    }
    // assigning newNumber to the chosen word
    let updateResult = await database.collection("groups").updateOne({_id: group._id}, 
        {$set: {"words.$[element].number": newNumber}},
        {arrayFilters: [{"element.word": req.body.word, "element.translation": req.body.translation}]});
    // console.log(updateResult);
    if (!updateResult.acknowledged) {
        res.json({success: false});
        return;
    }
    res.json({success: true, newNumber: newNumber});
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
    if (!req.body.groupName || !req.body.word || !req.body.translation || group === false) {
        res.json({success: false});
        return;
    }
    if (req.body.password === user.password) {
        // console.log(req.body);
        let updateResult = await database.collection("groups").updateOne({_id: group._id}, {$pull: {words: {word: req.body.word, translation: req.body.translation}}});
        if (!updateResult.acknowledged) {
            res.json({success: false});
        } else {
            res.json({success: true});
        }
    } else {
        res.json({success: false, message: "Password don't match."});
    }
})

module.exports = {wordsRouter};

function getNormalNumber(numberInString){
    let numParts = numberInString?.split(",");
    let newNumber = Number(numParts?.join("."));
    if (Number.isNaN(newNumber) || newNumber <= 0) {
        return Number.NaN;
    } else {
        numParts = String(newNumber).split(".");
        // number must have 5 digits before the decimal point and 3 after it
        if (numParts[0].length > 5) {
            return Number.NaN;
        } else if (numParts[1]?.length > 3){
            numParts[1] = numParts[1].slice(0, 3);
            console.log(numParts[1]);
            return numParts.join(".");
        } else {
            return newNumber;
        }
    }
}