# CodeAtlas — Parser Service

> **Part of the CodeAtlas platform** — A knowledge-graph-powered code intelligence system.

The **Parser Service** is a NestJS-based Kafka microservice responsible for ingesting Git repository URLs, cloning the source code, performing deep TypeScript AST analysis, and persisting the resulting Knowledge Graph (KG) into Neo4j. It serves as the core analysis engine of the CodeAtlas ecosystem.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Service](#running-the-service)
- [How It Works](#how-it-works)
- [AST Extractors](#ast-extractors)
- [Knowledge Graph Schema](#knowledge-graph-schema)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

CodeAtlas-Parser listens on a Kafka topic (`parser.create`) for project analysis requests. Upon receiving a job, it:

1. **Clones** the target Git repository (with optional branch & credentials)
2. **Parses** all TypeScript source files using the TypeScript compiler API (`ts-morph`)
3. **Extracts** a rich Knowledge Graph of nodes (classes, methods, routes, decorators, etc.) and relationships (imports, DI, inheritance, method calls, type usage)
4. **Persists** the KG into a **project-scoped Neo4j database**
5. **Dispatches** a follow-up job to the Vectorizer service via BullMQ for embedding generation
6. **Cleans up** temporary cloned files after processing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CodeAtlas Platform                             │
│                                                                         │
│  ┌──────────────┐    Kafka      ┌──────────────────────────────────┐    │
│  │  API Gateway │ ─────────────▶│        Parser Service            │    │
│  │  (Producer)  │  parser.create│                                  │    │
│  └──────────────┘               │  ┌───────────┐  ┌────────────┐   │    │
│                                 │  │ Git Clone │  │ AST Engine │   │    │
│                                 │  │ (simple-  │─▶│ (ts-morph) │   │    │
│                                 │  │   git)    │  └─────┬──────┘   │    │
│                                 │  └───────────┘        │          │    │
│                                 │                       ▼          │    │
│                                 │               ┌───────────────┐  │    │
│                                 │               │   Neo4j KG    │  │    │
│                                 │               │  (per-project │  │    │
│                                 │               │   database)   │  │    │
│                                 │               └───────────────┘  │    │
│                                 │                       │          │    │
│                                 │               BullMQ  ▼          │    │
│                                 │               ┌──────────────┐   │    │
│                                 │               │  Vectorizer  │   │    │
│                                 │               │   Queue Job  │   │    │
│                                 │               └──────────────┘   │    │
│                                 └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Features

- **Kafka Microservice** — Decoupled, event-driven architecture via KafkaJS
- **Git Cloning** — Supports authenticated HTTPS clones with optional branch targeting
- **TypeScript AST Parsing** — Deep structural analysis using `ts-morph` (TypeScript compiler API)
- **Knowledge Graph Generation** — Extracts nodes and typed relationships from source code
- **Neo4j Integration** — Per-project isolated databases with transactional imports
- **BullMQ Job Dispatch** — Triggers downstream vectorization after parsing completes
- **MongoDB Tracking** — Tracks project workflow status and emits user notifications at each stage
- **Auto Cleanup** — Removes cloned repositories after processing to conserve disk space
- **Relation Deduplication** — Prevents duplicate edges in the Knowledge Graph

---

## Tech Stack

| Technology | Role |
|---|---|
| [NestJS](https://nestjs.com/) | Application framework |
| [KafkaJS](https://kafka.js.org/) | Message broker client (microservice transport) |
| [ts-morph](https://ts-morph.com/) | TypeScript AST analysis |
| [Neo4j Driver](https://neo4j.com/developer/javascript/) | Graph database client |
| [BullMQ](https://docs.bullmq.io/) + Redis | Background job queues |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM (project/notification state) |
| [simple-git](https://github.com/steveukx/git-js) | Git repository cloning |
| TypeScript | Language |

---

## Project Structure

```
src/
├── main.ts                     # Kafka microservice bootstrap
├── app.module.ts               # Root module — wires Kafka, Neo4j, BullMQ, Mongo
│
├── kafka/                      # Kafka module
│   ├── kafka.module.ts         # Dynamic Kafka module registration
│   ├── kafka.service.ts        # Producer service
│   ├── kafka.topics.ts         # Topic definitions (parser.create)
│   ├── kafka.type.ts           # Kafka config types
│   └── kafka.constants.ts
│
├── neo4j/                      # Neo4j module
│   ├── neo4j.module.ts         # Dynamic Neo4j driver module
│   ├── neo4j.service.ts        # CRUD, batch import, database lifecycle
│   └── neo4j-config.interface.ts
│
├── queues/                     # BullMQ workers & queues
│   ├── code-parser.queue.ts    # Core worker: clone → parse → KG import → dispatch
│   ├── queues.module.ts
│   └── queue.constant.ts       # Queue name constants
│
├── modules/
│   ├── parser/                 # Kafka consumer controller + trigger logic
│   ├── project/                # Project schema, service, workflow status tracking
│   ├── notification/           # Notification schema for real-time user updates
│   ├── user/
│   ├── role/
│   └── policy/
│
├── utils/
│   ├── git.utils.ts            # Git clone helpers (auth URL, path management)
│   └── ast/                   # TypeScript AST extractor functions
│       ├── extract-structure.ts        # Classes, interfaces, functions, decorators
│       ├── extract-di.ts              # Dependency injection relationships
│       ├── extract-imports.ts         # Import/export relationships
│       ├── extract-inheritance.ts     # extends / implements relationships
│       ├── extract-method-calls.ts    # Method invocation graph
│       ├── extract-routes.ts          # HTTP route nodes (@Get, @Post, etc.)
│       ├── extract-type-usage.ts      # Type reference relationships
│       ├── extract-descriptions.ts    # JSDoc / inline descriptions
│       ├── extract-markdown-docs.ts   # Markdown documentation linking
│       ├── id-generator.ts            # Deterministic entity ID generation
│       └── detect-file-subtype.ts     # File classification (controller, service, etc.)
│
├── interfaces/                 # Shared TypeScript interfaces
└── types/
    └── kg.types.ts             # KGNode, KGRelation, Documentation types
```

---

## Prerequisites

Ensure the following services are running before starting the Parser Service:

| Service | Default Port | Notes |
|---|---|---|
| Apache Kafka | `9092` | Requires a running broker |
| Redis | `6379` | Used by BullMQ for queue state |
| Neo4j | `7687` | Graph database (bolt protocol) |
| MongoDB | Atlas / `27017` | Project & notification storage |

---

## Environment Variables

Create a `.env.development` file in the project root (used by `ConfigModule`):

```env
# ── Kafka ──────────────────────────────────────────────
KAFKA_BROKER_URL=localhost:9092
KAFKA_CLIENT_ID=codeatlas-parser
KAFKA_GROUP_ID=codeatlas-consumer-group
KAFKA_TOPIC=code-analysis-events
KAFKA_APP_ID=codeatlas-parser

# ── Redis (BullMQ) ─────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ── Neo4j ──────────────────────────────────────────────
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# ── MongoDB ────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
MONGODB_DB_NAME=code_atlas_db

# ── Git (optional defaults) ────────────────────────────
GIT_USER_NAME=your_git_username
GIT_PASSWORD=your_git_token
```

> **Note:** Per-project Git credentials are stored in MongoDB and passed via Kafka job payloads — these `.env` values serve as fallbacks or dev defaults only.

---

## Installation

```bash
# Using pnpm (recommended)
pnpm install

# Or npm
npm install

# Or yarn
yarn install
```

---

## Running the Service

```bash
# Development (watch mode)
pnpm run dev

# Standard start
pnpm run start

# Production (compiled output)
pnpm run prod
```

> The service runs as a **Kafka microservice** — it does not expose an HTTP port. Make sure Kafka is reachable at `KAFKA_BROKER_URL` before starting.

---

## How It Works

### End-to-End Job Flow

```
1. Kafka consumer receives a `parser.create` message with { _id: projectId }
        │
        ▼
2. CodeParserQueue worker picks up the BullMQ job
        │
        ▼
3. Fetch project document from MongoDB (git_link, git_username, git_password, branch)
        │
        ▼
4. Clone Git repository → ./projects/<project_uuid>/
        │
        ▼
5. Run TypeScript AST analysis via ts-morph:
   - extractStructure   → class/interface/function nodes
   - extractDI          → INJECTS relationships
   - extractMethodCalls → CALLS relationships
   - extractRoutes      → HTTP route nodes
   - extractTypeUsage   → USES_TYPE relationships
   - extractImports     → IMPORTS relationships
   - extractInheritance → EXTENDS / IMPLEMENTS relationships
   - extractMarkdownDocs → linked documentation
   - extractDescriptions → JSDoc descriptions
        │
        ▼
6. Deduplicate relations (by from|to|type key)
        │
        ▼
7. neo4jService.cleanAndImport(projectUuid, nodes, relations)
   - Creates project-scoped Neo4j database if not exists
   - Clears previous graph data
   - Batch-imports nodes and relations in transactions
        │
        ▼
8. projectService.dumpDocumentation() → saves docs to MongoDB
        │
        ▼
9. Enqueue vectorization job → BullMQ VECTORIZER_WORKER_QUEUE
        │
        ▼
10. Update project workflow_status → COMPLETED
    Create success notification for the user
        │
        ▼
11. Clean up cloned repository from disk
```

---

## AST Extractors

All extractors live in `src/utils/ast/` and receive a `ts-morph` `Project` instance:

| Extractor | Output | Description |
|---|---|---|
| `extractStructure` | Nodes + Relations | Classes, interfaces, methods, properties, decorators and their structural relationships |
| `extractDI` | Relations | `INJECTS` edges from NestJS constructor injection |
| `extractMethodCalls` | Relations | `CALLS` edges between methods across files |
| `extractRoutes` | Nodes + Relations | HTTP route nodes from `@Get`, `@Post`, etc. decorators, linked to controllers |
| `extractTypeUsage` | Relations | `USES_TYPE` edges where types are referenced as parameter/return types |
| `extractImports` | Relations | `IMPORTS` edges between files and their dependencies |
| `extractInheritance` | Relations | `EXTENDS` and `IMPLEMENTS` edges from class declarations |
| `extractDescriptions` | Documentation | JSDoc comments and inline descriptions per entity |
| `extractMarkdownDocs` | Documentation | Markdown files in the repo matched to KG nodes |

---

## Knowledge Graph Schema

### Node Types (`KGNode`)

| Label | Represents |
|---|---|
| `Class` | TypeScript class |
| `Interface` | TypeScript interface |
| `Function` | Standalone function |
| `Method` | Class method |
| `Property` | Class property |
| `Decorator` | Applied decorator |
| `Route` | HTTP endpoint |

### Relationship Types (`KGRelation`)

| Type | Meaning |
|---|---|
| `HAS_METHOD` | Class → Method |
| `HAS_PROPERTY` | Class → Property |
| `INJECTS` | Service → Injected dependency |
| `CALLS` | Method → called Method |
| `IMPORTS` | File → imported symbol/file |
| `EXTENDS` | Class → parent Class |
| `IMPLEMENTS` | Class → Interface |
| `USES_TYPE` | Entity → referenced Type |
| `HAS_ROUTE` | Controller → Route |

---

## Scripts

```bash
pnpm run build        # Compile TypeScript → dist/
pnpm run dev          # Start with file watcher (development)
pnpm run start        # Start without watcher
pnpm run prod         # Run compiled production build
pnpm run lint         # ESLint with auto-fix
pnpm run format       # Prettier format
pnpm run test         # Unit tests
pnpm run test:watch   # Unit tests in watch mode
pnpm run test:cov     # Test coverage report
pnpm run test:e2e     # End-to-end tests
```

---

## License

Private — All rights reserved.
