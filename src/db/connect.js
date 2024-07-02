import { MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "mongodb+srv://ivankoretskyy3:testpassword20240627@cluster0.vzvonrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch(e) {
  console.error(e);
}

let db = conn.db("test1");

export default db;