# Express.js + TypeScript + PostgreSQL Template

A modern, scalable, and production-ready Node.js API template designed for building robust RESTful APIs. This template provides a solid foundation with a clean project structure, full TypeScript support, a powerful ORM, and containerization with Docker.

## ✨ Features

- **Modern Tech Stack**: Built with Node.js, Express.js, TypeScript, and PostgreSQL.
- **High-Performance ORM**: Integrates **Drizzle ORM** for type-safe, efficient database queries.
- **Containerized**: Full **Docker** and **Docker Compose** setup for consistent development and production environments.
- **API Documentation**: Automatic API documentation generation with **Swagger (OpenAPI)**.
- **Structured Logging**: Centralized and environment-aware logging with **Winston**.
- **Robust Security**: Includes `helmet` for securing HTTP headers, `express-rate-limit` to prevent brute-force attacks, and input sanitization.
- **Code Quality**: Enforces code style and quality with **ESLint** and **Prettier**.
- **Testing Ready**: Pre-configured with **Jest** for unit and integration testing.
- **Database Migrations**: Simple database schema management and migrations powered by **Drizzle Kit**.
- **CI/CD Ready**: Husky pre-commit hooks to ensure code quality before commits.

## 🛠️ Tech Stack

| Category          | Technology                                                              |
| ----------------- | ----------------------------------------------------------------------- |
| **Backend**       | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)     |
| **Language**      | [TypeScript](https://www.typescriptlang.org/)                           |
| **Database**      | [PostgreSQL](https://www.postgresql.org/)                               |
| **ORM**           | [Drizzle ORM](https://orm.drizzle.team/)                                |
| **API Docs**      | [Swagger](https://swagger.io/) / [OpenAPI](https://www.openapis.org/)   |
| **Testing**       | [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest) |
| **Containerization**| [Docker](https://www.docker.com/)                                       |
| **Code Quality**  | [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)          |
| **Logging**       | [Winston](https://github.com/winstonjs/winston)                         |

## 📁 Project Structure

```
.
├── bruno/              # Bruno API client collection
├── drizzle/            # Drizzle ORM migration files
├── src/
│   ├── app.ts          # Express app configuration and middlewares
│   ├── server.ts       # Server entry point
│   ├── config/         # App configuration (Swagger, etc.)
│   ├── constants/      # App-wide constants
│   ├── controllers/    # Route handlers
│   ├── db/             # Database connection setup
│   ├── mappers/        # Data transformation logic
│   ├── middlewares/    # Custom Express middlewares
│   ├── models/         # Drizzle ORM schemas
│   ├── repositories/   # Database query logic
│   ├── routes/         # API route definitions
│   ├── schemas/        # Zod validation schemas
│   ├── services/       # Business logic
│   ├── types/          # Custom TypeScript types
│   └── utils/          # Utility functions and classes
├── tests/              # Jest tests (integration, unit)
├── .env.example        # Example environment variables
├── docker-compose.yml  # Docker Compose configuration
├── Dockerfile          # Docker configuration for the app
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20.x or higher)
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Set Up Environment Variables

Create a `.env` file by copying the example file:

```bash
cp .env.example .env
```

Update the `.env` file with your desired settings. The default values are configured to work with the provided Docker Compose setup.

```env
# Application Port
PORT=4000

# PostgreSQL Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db

# Node Environment
NODE_ENV=development
```

### 3. Installation and Running the App

You can run this project using Docker (recommended for ease of use) or by setting up a local environment.

#### Option A: Docker (Recommended)

This is the simplest way to get started. It automatically sets up the Express API and a PostgreSQL database container.

1.  **Build and run the containers:**

    ```bash
    docker-compose up --build -d
    ```

2.  **Run database migrations:**

    This command applies the Drizzle ORM schemas to the database.

    ```bash
    docker-compose exec api npm run db:push
    ```

The API will be available at `http://localhost:4000`.

#### Option B: Local Development

If you prefer to run the application without Docker, you'll need a local PostgreSQL instance.

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up a local PostgreSQL database.**

3.  **Update the database configuration variables in your `.env` file** to point to your local database instance.

4.  **Run database migrations:**

    ```bash
    npm run db:push
    ```

5.  **Start the development server:**

    ```bash
    npm run dev
    ```

The API will be available at `http://localhost:4000`.

## 📖 API Reference

An interactive Swagger UI is available to explore and test the API endpoints. Once the application is running, access it at:

**`http://localhost:4000/api-docs`**

Key endpoints include:
- `GET /api/healthz`: Health check for the service.
- `GET /api/examples`: Fetch a list of examples.
- `POST /api/examples`: Create a new example.
- ...and other CRUD operations.

## ⚙️ Available Scripts

| Script             | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `npm start`        | Starts the production server (requires `npm run build`).    |
| `npm run dev`      | Starts the development server with hot-reloading.           |
| `npm run build`    | Compiles TypeScript to JavaScript for production.           |
| `npm test`         | Runs tests using Jest.                                      |
| `npm run lint`     | Lints the codebase using ESLint.                            |
| `npm run lint:fix` | Automatically fixes linting issues.                         |
| `npm run format`   | Formats the code using Prettier.                            |

### Database Scripts

| Script              | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `npm run db:generate` | Generates a new SQL migration file based on schema changes. |
| `npm run db:migrate`  | Applies all pending migrations to the database.             |
| `npm run db:push`     | Pushes schema changes directly to the database (for dev).   |
| `npm run db:studio`   | Opens the Drizzle Studio to browse your database.           |

## 🚢 Deployment

For production, it's recommended to use a multi-stage Docker build to create a smaller, more secure image. This `Dockerfile` separates build-time dependencies from the final runtime image.

```dockerfile
# 1. Build Stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Production Stage
FROM node:20-slim AS production
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production
# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please see the `CONTRIBUTING.md` file for guidelines on how to get started.

## 📄 License

This project is licensed under the **ISC License**. See the `LICENSE` file for details.