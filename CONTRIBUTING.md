# Contributing to the Express.js + TypeScript + PostgreSQL Template

First off, thank you for considering contributing! Your help is greatly appreciated. This document provides guidelines to help you get started.

## Code of Conduct

This project and everyone participating in it is governed by a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior. (Note: A `CODE_OF_CONDUCT.md` should be created).

## How Can I Contribute?

You can contribute in several ways, including reporting bugs, suggesting enhancements, or submitting pull requests for new features or bug fixes.

### Reporting Bugs

If you find a bug, please open an issue and provide a clear description, including steps to reproduce it.

### Suggesting Enhancements

If you have an idea for an improvement, open an issue to discuss it. This allows us to coordinate efforts and ensure the suggestion aligns with the project's goals.

## 🚀 Development Setup

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
3.  **Set up the project** by following the instructions in the [**README.md**](./README.md). The recommended approach is to use Docker.
4.  **Create a new branch** for your changes:
    ```bash
    git checkout -b feat/my-awesome-feature
    ```
    Use a descriptive branch name, like `feat/add-user-auth` or `fix/pagination-bug`.

## ✍️ Making Changes

- **Follow the existing code style.** We use ESLint and Prettier to maintain a consistent style.
- **Run the linter and formatter** before committing to ensure your code adheres to the project's standards.
  ```bash
  # Check for linting and formatting errors
  npm run lint
  npm run format:check

  # Automatically fix issues
  npm run lint:fix
  npm run format
  ```
- **Add tests** for any new features or bug fixes to maintain code quality and prevent regressions.
- **Ensure all tests pass** before submitting your changes.
  ```bash
  npm test
  ```

### Database Schema Changes

If you make changes to a database schema in the `src/models/` directory, you must generate a new migration.

1.  **Modify the schema file** (e.g., `src/models/example.schema.ts`).
2.  **Generate a new migration** using Drizzle Kit:
    ```bash
    # If using Docker
    docker-compose exec api npm run db:generate

    # If running locally
    npm run db:generate
    ```
3.  **Review the generated SQL migration file** in the `drizzle/` directory to ensure it is correct.
4.  **Commit the new migration file** along with your other changes.

## 💬 Commit Message Guidelines

We follow the [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps in creating a clear commit history and automating changelog generation.

Your commit messages should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Common Types:**

- `feat`: A new feature.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to the build process or auxiliary tools.

**Example:**

```
feat: Add user profile endpoint

Adds a new GET /api/users/profile endpoint to retrieve the
currently authenticated user's profile information.
```

## 📤 Submitting a Pull Request

1.  **Push your branch** to your forked repository:
    ```bash
    git push origin feat/my-awesome-feature
    ```
2.  **Open a Pull Request** to the `main` branch of the original repository.
3.  **Provide a clear title and description** for your pull request, explaining the "what" and "why" of your changes.
4.  **Link to any relevant issues** in your pull request description (e.g., "Closes #123").
5.  **Wait for a review.** We will review your PR as soon as possible and may suggest some changes.

Thank you for your contribution!
