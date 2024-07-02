import { v4 as uuidv4 } from 'uuid';

import { MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "mongodb+srv://ivankoretskyy3:testpassword20240627@cluster0.vzvonrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// TODO: MOVE TO COMMON;
const client = new MongoClient(connectionString);

export const userService = {
    async getUserById(userId) {
        console.info("--------------getUserById----------------");
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("users");
            let query = {id: userId};
            let user = await collection.findOne(query);
            console.info('------- mongo-getUserById user:--------------', user);
            console.info('-');
            return user;
        }
        catch(error) {
            console.error('error gettting mongo', error);
            return null;
        }

    },

    async getUserByUsername(username) {
        console.info("--------------getUserByUsername----------------");
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("users");
            let user = await collection.findOne({"username": username});
            console.info('--------finsih------- mongo getUserByUsername user:------------', user);
            console.info('-');
            if (!user) {
                return null;
            }
            return {id: user.id, username: username};
        }
        catch(error) {
            console.error('error gettting mongo', error)
            return null;
        }
    },

    async createUser(username) {
        const id = uuidv4();
        console.info("--------------createUser----------------");
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("users");
            let newDocument = {username, id};
            let result = await collection.insertOne(newDocument);
            console.info('-------mongo finsih-----createUser user:----', result);
            console.info('-');
            
        }
        catch(error) {
            console.error('error gettting mongo', error);
            //return null;
        }
        return {id, username}

    }
};