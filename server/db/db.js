const dotenv = require('dotenv');
const mongoose = require('mongoose');
const createChatGPTUser = require('../models/initChatGPTUser');

dotenv.config();

// DB Variables
var mongoURI = process.env.MONGODB_URI;

// Check if the environment variable is set
const connectDb = async () => {
    try {
        const conn = await mongoose.connect(mongoURI);
        await createChatGPTUser();
        console.log('Connected to MongoDB: ' + conn.connection.host);
    } catch (error) {
        console.error(`Error connecting to MongoDB ${mongoURI} : ` + error);
        process.exit(1);
    }
};

module.exports = { connectDb };
