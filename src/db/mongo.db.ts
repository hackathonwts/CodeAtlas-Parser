import mongoose from 'mongoose';
import config from '../config';
mongoose.set('strictQuery', true);

export default async (): Promise<typeof mongoose> => {
    try {
        const uri = config.mongoDb.port ? `${config.mongoDb.host}:${config.mongoDb.port}` : config.mongoDb.host;
        const connection = await mongoose.connect(uri, {
            dbName: config.mongoDb.database || undefined,
            auth: {
                username: config.mongoDb.username,
                password: config.mongoDb.password
            },
            connectTimeoutMS: 10000,
        });


        return connection;
    } catch (error) {
        console.error(error);
        throw new Error('Unable to connect to database: ' + error);
    }
}

mongoose.connection.on('connected', () => {
    console.log('DB has connected succesfully');
})
mongoose.connection.on('reconnected', () => {
    console.log('DB has reconnected');
})
mongoose.connection.on('error', error => {
    console.log('DB connection has an error', error);
    mongoose.disconnect();
})
mongoose.connection.on('disconnected', () => {
    console.log('DB connection is disconnected');
})
