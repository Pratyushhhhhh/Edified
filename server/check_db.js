const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Use the collection name you specified
        const collection = mongoose.connection.db.collection('cluster_test_v2');
        const sample = await collection.findOne({});
        
        console.log('--- Sample Document ---');
        console.log(JSON.stringify(sample, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
