export default {
    neo4j: {
        host: process.env.GRAPH_DB_HOST,
        port: process.env.GRAPH_DB_PORT,
        username: process.env.GRAPH_DB_USER,
        password: process.env.GRAPH_DB_PASSWORD,
    },
    chromadb: {
        host: process.env.CHROMA_HOST,
        port: process.env.CHROMA_PORT,
    },
    mongoDb: {
        host: process.env.MONGO_DB_HOST,
        port: process.env.MONGO_DB_PORT,
        database: process.env.MONGO_DB_DATABASE,
        username: process.env.MONGO_DB_USERNAME,
        password: process.env.MONGO_DB_PASSWORD,
    },
};
