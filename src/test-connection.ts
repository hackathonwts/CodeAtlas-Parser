import connectDb from './db/mongo.db';

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        await connectDb();
        console.log('Connection test successful!');
        process.exit(0);
    } catch (error) {
        console.error('Connection test failed:');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
