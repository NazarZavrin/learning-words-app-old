async function findIfUnique(collection, filter){
    let cursor = collection.find(filter);
    let result = await cursor.toArray();
    cursor.close();
    return result.length === 1 ? result[0] : false;
}
module.exports = {findIfUnique}