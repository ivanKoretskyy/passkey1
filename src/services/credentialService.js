import { MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "mongodb+srv://ivankoretskyy3:testpassword20240627@cluster0.vzvonrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(connectionString);

export const credentialService = {
    async saveNewCredential(userId, credentialId, publicKey, counter, transports) {
        console.info("--------------saveNewCredential----------------");
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("credentials");
            let newDocument = {userId, credentialId, publicKey, counter, transports };
            let result = await collection.insertOne(newDocument);
            console.info('-----finish mongo -------saveNewCredential credentials:----', result);
            console.info('-');
        }
        catch(error) {
            console.error('Error saving new credential:', error)
        }

    },

    async getCredentialByCredentialId(credentialId) {
        console.info('----------getCredentialByCredentialId-----------------')
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("credentials");
            let query = {credentialId};
            let credential = await collection.findOne(query);
            console.info('----minsish mongo ----getcredentialById credential:--------------', credential);
            console.info('-');
            const ret = {
                userID: credential?.userId,
                credentialID: credential?.credentialId,
                credentialPublicKey: credential?.publicKey,
                counter: credential?.counter,
                transports: credential?.transports ? credential?.transports.split(',') : [],
            };
            console.info('----finish sql----getcredentialById credential:--------------', ret);
            console.info('-');
            return ret;
        }
        catch(error) {
            console.error(' Error retrieving credential:', error);
            return null;
        }

    },

    async updateCredentialCounter(credentialId, newCounter) {
        console.info('----------------updateCredentialCounter-----------------------')
        try {
            let conn = await client.connect();
            let collection = await conn.db("test1").collection("credentials");
            let query = {credentialId};
            let credential = await collection.updateOne(query,{$set:{"counter":newCounter}});
            console.info(' finsih mongo updating counter in credential', credential);
            console.info('-');
        }
        catch(error) {
            console.error(' Error updating counter credential:', error)
            throw error;
        }
    }
};