# Basic Example App

Simple Express.js app with two endpoints to demonstrate Restflow testing.

## Getting Started

1. **Start the server:**
   ```bash
   # From the workspace root
   pnpm nx serve @restflow/basic
   ```

2. **Run the flows:**
   ```bash
   # Run individual flows
   restflow run flows/health.flow
   restflow run flows/users.flow

   # Run all flows
   restflow run flows/
   ```

## Endpoints

- `GET /health` - Returns app status and version
- `POST /register` - Register a new user
- `POST /login` - Login with email/password
- `GET /auth/profile` - Get user profile (requires JWT token)

## Flow Files

- `flows/1-health.flow` - Basic health check validation
- `flows/2-register.flow` - User registration test
- `flows/3-login.flow` - User login test

## Flow Format

Each flow file uses the `.flow` format with steps separated by `###`:

```flow
### Step Name
GET http://localhost:3000/endpoint

> assert status == 200
> capture variable = body.field
```
