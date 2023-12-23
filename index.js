    import config from './utils/config.js';
    import mongoose from 'mongoose';
    import { MongoClient } from 'mongodb';
    import app from './app.js';

    mongoose.set('strictQuery', false);

    const client = new MongoClient(config.MONGODB_URI);
    // await client.connect();

    console.log('connecting to mongoDB...');

mongoose.connect(config.MONGODB_URI)
        .then(() => {
            console.log('connected to MongoDB...');

        app.listen(config.PORT, () => {
        console.log(`Server is running on port ${config.PORT}`);
    });
        })
        .catch((error) => {
            console.log('error connecting to MongoDB:', error.message);
        }); 

export { client };