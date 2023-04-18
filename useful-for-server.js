async function findIfUnique(collection, filter){
    let cursor = collection.find(filter);
    let result = await cursor.toArray();
    cursor.close();
    return result.length === 1 ? result[0] : false;
    /* collection.findOne() returns the first matching document
    if there are a few matching documents in the DB.
    function findIfUnique returns false 
    if there are a few matching documents in the DB.
    */
}
function getMaxFreeNumber(wordsArray) {
    let numberToSet = 99999.999;
    // console.log("length", group.words?.length);
    for (let i = 0, j = 0; i < wordsArray?.length; i++) {
        // console.log("#", i, j);
        // console.log(wordsArray[i].word, wordsArray[i].number);
        if (wordsArray[i].number === numberToSet) {
            numberToSet -= 0.001;
            numberToSet = +numberToSet.toFixed(3);
            if (j < 10**4 && numberToSet > 0) {// to avoid infinite cycle
                // console.log("j", j);
                i = -1;// increment in the end adds one and i will be 0
                j++;
                continue;
            } else {
                return -1;
            }
        }
    }
    return numberToSet;
}
function getMinFreeNumber(wordsArray, numberToSet = 0.001){
    // console.log("length", group.words?.length);
    for (let i = 0, j = 0; i < wordsArray?.length; i++) {
        // console.log("#", i, j);
        // console.log(wordsArray[i].word, wordsArray[i].number);
        if (wordsArray[i].number === numberToSet) {
            numberToSet += 0.001;
            numberToSet = +numberToSet.toFixed(3);
            if (j < 10**4 && numberToSet <= 99999.999) {// to avoid infinite cycle
                // console.log("j", j);
                i = -1;// increment in the end adds one and i will be 0
                j++;
                continue;
            } else {
                return -1;
            }
        }
    }
    return numberToSet;
}
module.exports = {findIfUnique, getMaxFreeNumber, getMinFreeNumber}