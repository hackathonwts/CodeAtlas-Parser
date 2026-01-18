# CodeAtlas Parser - NestJS Microservice

A NestJS microservice that parses TypeScript projects and extracts knowledge graphs, triggered by Kafka messages.

## Overview

This service listens to Kafka messages and processes TypeScript repositories by:
1. Fetching project configuration from MongoDB
2. Cloning Git repositories
3. Parsing TypeScript code to extract knowledge graphs
4. Ingesting parsed data into Neo4j
5. Storing documentation in MongoDB

## Architecture

- **Framework**: NestJS with microservices support
- **Message Broker**: Kafka (consumer)
- **Databases**: 
  - MongoDB (project metadata & documentation)
  - Neo4j (knowledge graph storage)
  - ChromaDB (optional, for vector embeddings)

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Docker & Docker Compose (for databases)
- Kafka cluster (or local via Docker Compose)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_DB_HOST=mongodb://localhost
MONGO_DB_PORT=27017
MONGO_DB_DATABASE=codeatlas
MONGO_DB_USERNAME=admin
MONGO_DB_PASSWORD=password

# Neo4j
GRAPH_DB_HOST=bolt://localhost
GRAPH_DB_PORT=7687
GRAPH_DB_USER=neo4j
GRAPH_DB_PASSWORD=password

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_PARSE_REQUEST=parse-requests
KAFKA_TOPIC_PARSE_RESPONSE=parse-responses
KAFKA_GROUP_ID=codeatlas-parser-group
KAFKA_CLIENT_ID=codeatlas-parser
```

## Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

## Running the Service

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## Starting Dependencies

Use Docker Compose to start all required services:

```bash
docker-compose up -d
```

This starts:
- MongoDB (port 27017)
- Neo4j (ports 7474, 7687)
- ChromaDB (port 8000)
- Kafka + Zookeeper (port 9092)
- Redis (port 6379)

## Kafka Message Format

### Parse Request Message

Send messages to the `parse-requests` topic with the following format:

```json
{
  "projectId": "wts-nest-setup-dev-aa4bcqpu",
  "action": "parse_repository"
}
```

**Fields:**
- `projectId` (required): UUID or MongoDB ObjectId of the project to parse
- `action` (required): Action to perform, should be `"parse_repository"`

### Example: Sending a Test Message

Using `kafka-console-producer`:

```bash
echo '{"projectId":"wts-nest-setup-dev-aa4bcqpu","action":"parse_repository"}' | \
  kafka-console-producer \
  --broker-list localhost:9092 \
  --topic parse-requests
```

Using Node.js KafkaJS:

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

await producer.connect();
await producer.send({
  topic: 'parse-requests',
  messages: [{
    value: JSON.stringify({
      projectId: 'wts-nest-setup-dev-aa4bcqpu',
      action: 'parse_repository'
    })
  }]
});

await producer.disconnect();
```

## Health Checks

The service exposes HTTP endpoints for health monitoring:

```bash
# Overall health
curl http://localhost:3000/health

# MongoDB health
curl http://localhost:3000/health/mongodb

# Service info
curl http://localhost:3000
```

## Project Setup in MongoDB

Before sending a Kafka message, ensure the project exists in MongoDB:

```javascript
// Example project document
{
  "gitUrl": "https://github.com/user/repo.git",
  "branch": "main",
  "projectName": "my-project",
  "username": "git-username",
  "password": "git-token-or-password",
  "uuid": "my-project-main-xyz123",
  "scanVersion": 0,
  "isDeleted": false
}
```

## Workflow

1. **Kafka Message Received**: Service listens on `parse-requests` topic
2. **Project Lookup**: Fetches project from MongoDB using `projectId`
3. **Repository Clone**: Clones the Git repository to local storage
4. **Parsing**: Extracts knowledge graph (nodes & relations) using `ts-morph`
5. **Neo4j Ingestion**: Imports graph data into Neo4j database
6. **Documentation Storage**: Saves markdown and descriptions to MongoDB
7. **Version Update**: Increments project `scanVersion`
8. **Acknowledgment**: Message is acknowledged, or retried on failure

## Monitoring Logs

The service provides detailed logging:

```bash
# Development mode with live reload
npm run start:dev

# Watch for logs like:
# ✅ Kafka microservice started
# 📡 Brokers: localhost:9092
# 📨 Received parse request from Kafka | Topic: parse-requests | Partition: 0 | Offset: 42
# 🚀 Starting processing for project: wts-nest-setup-dev-aa4bcqpu
# ✅ Project found: wts-nest-setup (dev)
# ✅ Repository cloned successfully
# ✅ Parsed 1234 nodes and 5678 relations
# ✅ Knowledge Graph imported to Neo4j
# ✅ Documentation dumped successfully
# ✅ Project processing completed successfully
```

## Troubleshooting

### Kafka Connection Issues
- Ensure Kafka is running: `docker-compose ps`
- Check broker address in `.env`
- Verify topic exists: `kafka-topics --list --bootstrap-server localhost:9092`

### MongoDB Connection Issues
- Check MongoDB is running: `docker-compose ps`
- Verify credentials in `.env`
- Test connection: `mongosh "mongodb://admin:password@localhost:27017"`

### Neo4j Connection Issues
- Verify Neo4j is running: http://localhost:7474
- Check credentials in `.env`
- Test connection via Neo4j Browser

### Repository Clone Failures
- Verify Git credentials in project document
- Check network connectivity
- Ensure sufficient disk space in `projects/` directory

## Development

### Old Main.ts Script
The original standalone script is still available:

```bash
npm run dev:old
```

This runs the old `src/main.ts` directly without Kafka.

### Project Structure

```
src/
├── app.module.ts                 # Root application module
├── app.controller.ts             # Basic HTTP controller
├── main.nest.ts                  # NestJS bootstrap file
├── config/
│   ├── configuration.ts          # Environment configuration
│   └── index.ts                  # Legacy config (deprecated)
├── kafka/
│   ├── kafka.module.ts           # Kafka consumer module
│   └── kafka.controller.ts       # Message pattern handlers
├── parser/
│   ├── parser.module.ts
│   ├── parser.service.ts         # Core parsing logic
│   └── parser-orchestration.service.ts  # Workflow orchestration
├── git-manager/
│   ├── git-manager.module.ts
│   └── git-manager.service.ts    # Repository cloning
├── neo4j/
│   ├── neo4j.module.ts
│   └── neo4j.service.ts          # Neo4j operations
├── documentation/
│   ├── documentation.module.ts
│   └── documentation.service.ts  # MongoDB documentation storage
├── health/
│   ├── health.module.ts
│   └── health.controller.ts      # Health check endpoints
└── schemas/
    ├── project.schema.ts         # Project Mongoose schema
    ├── project-description.schema.ts
    └── project-markdown.schema.ts
```

## License

MIT

## Author

Rabbul Ansary <itsrabbul@gmail.com>
