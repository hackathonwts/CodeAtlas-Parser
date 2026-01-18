export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    mongodb: {
        host: process.env.MONGO_DB_HOST || 'mongodb://localhost',
        port: process.env.MONGO_DB_PORT ? parseInt(process.env.MONGO_DB_PORT, 10) : 27017,
        database: process.env.MONGO_DB_DATABASE || 'codeatlas',
        username: process.env.MONGO_DB_USERNAME || 'admin',
        password: process.env.MONGO_DB_PASSWORD || 'password',
    },

    neo4j: {
        host: process.env.GRAPH_DB_HOST || 'bolt://localhost',
        port: process.env.GRAPH_DB_PORT || '7687',
        username: process.env.GRAPH_DB_USER || 'neo4j',
        password: process.env.GRAPH_DB_PASSWORD || 'password',
    },

    chromadb: {
        host: process.env.CHROMA_HOST || 'http://localhost',
        port: process.env.CHROMA_PORT || '8000',
    },

    kafka: {
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
        topicParseRequest: process.env.KAFKA_TOPIC_PARSE_REQUEST || 'parse-requests',
        topicParseResponse: process.env.KAFKA_TOPIC_PARSE_RESPONSE || 'parse-responses',
        groupId: process.env.KAFKA_GROUP_ID || 'codeatlas-parser-group',
        clientId: process.env.KAFKA_CLIENT_ID || 'codeatlas-parser',
    },

    git: {
        username: process.env.GIT_USER_NAME || '',
        password: process.env.GIT_PASSWORD || '',
        url: process.env.GIT_URL || '',
    },
});
