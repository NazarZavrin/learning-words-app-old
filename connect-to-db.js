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