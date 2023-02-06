// ↓ connecting to the database
const { MongoClient, ServerApiVersion } = require('mongodb'); 
let database;
async function connectToDb(req, res, next) {
    // console.log("Connect to db if needed. URL: " + req.originalUrl);
    if (database === undefined) {
        let uri = "mongodb+srv://nazar:learnwords@main-cluster.dlb856s.mongodb.net/?retryWrites=true&w=majority";
        let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        try {
            await client.connect();
            database = client.db("userData");
            /*let groups = await database.collection("groups").find({ownersObjectId: ObjectId("63b8120ab5e1b0994bda5ddc")}).project({_id: 1, words: 1, ownersObjectId: 1}).map(group => {
                group.wordsLength = group?.words?.length;
                delete group.words;
                return group;
            }).toArray();
            console.log(groups);
            let num = 1;
            for (let i = 0; i < groups.length; i++) {
                num = 1;
                console.log("wordsLength:", groups[i].wordsLength);
                for (let j = 0; j < groups[i].wordsLength; j++) {
                    let updateResult = await database.collection("groups").updateOne({_id: groups[i]._id}, {$set: {["words." + j + ".number"]: num}});
                    
                    console.log("acknowledged:", updateResult.acknowledged, "modifiedCount:", updateResult.modifiedCount);
                    console.log(groups[i]._id, num);
                    ++num;
                }
                
            }*/
            // console.log("Connected to the db.");
        } catch (error) {
            console.log(error);
            await client.close();
            return "Database connection error.";
        }
    }
    return database;
}
module.exports = {connectToDb};