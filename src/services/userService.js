import { v4 as uuidv4 } from 'uuid';
import db from "../db/connect.js";

export const userService = {
    async getUserById(userId) {
        console.info("--------------getUserById----------------");
        try {
            let collection = await db.collection("users");
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
            let collection = await db.collection("users");
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
            let collection = await db.collection("users");
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