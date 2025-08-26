# Restflow

A powerful CLI tool for API testing and workflow automation using a simple, human-readable DSL.

## Features

- **Simple DSL**: Write API tests in plain text with `.flow` files
- **Variable Substitution**: Use `{{variable}}` syntax for dynamic values
- **Environment Support**: Load variables from `.env` files
- **Assertions**: JSONPath and regex-based response validation
- **Multiple Output Formats**: Console (colored), JSON, and summary reports
- **Step Dependencies**: Capture values from responses and use in subsequent steps
- **Fast Execution**: Concurrent request processing with timeout support

## Quick Start

### Installation

```bash
# Create a new project
pnpm create restflow my-api-tests

# Or install CLI globally
npm install -g @restflow/cli
# or
pnpm add -g @restflow/cli
```

### Basic Usage

1. **Create a flow file** (`api-test.flow`):

```flow
### Health Check
GET https://api.example.com/health

> assert status == 200
> assert body.status == "ok"

### Create User
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}

> assert status == 201
> assert body.email == "john@example.com"
> capture userId = body.id

### Get User
GET https://api.example.com/users/{{userId}}

> assert status == 200
> assert body.name == "John Doe"
```

2. **Run the flow**:

```bash
restflow run api-test.flow
```

3. **See results**:

```
Found 1 flow file(s) to execute
[1/3] Step: Health Check
  ✅ GET https://api.example.com/health - 200 (120ms)
    ✓ assert: status == 200
    ✓ assert: body.status == "ok"

[2/3] Step: Create User
  ✅ POST https://api.example.com/users - 201 (340ms)
    ✓ assert: status == 201
    ✓ assert: body.email == "john@example.com"
    ✓ capture: userId → body.id

[3/3] Step: Get User
  ✅ GET https://api.example.com/users/123 - 200 (89ms)
    ✓ assert: status == 200
    ✓ assert: body.name == "John Doe"

Summary: ✅ PASSED
Steps: 3/3 passed
Directives: 7/7 passed
Duration: 549ms
```

## Flow Syntax

### Basic Structure

```flow
### Step Name
HTTP_METHOD url
Header-Name: header-value

request-body

> directive
> another-directive
```

### HTTP Methods

```flow
### GET Request
GET https://api.example.com/users

### POST with JSON
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com"
}

### PUT with headers
PUT https://api.example.com/users/123
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "John Updated"
}
```

### Directives

#### Assertions
```flow
> assert status == 200
> assert status != 404
> assert body.name == "John"
> assert body.users.length > 0
> assert headers["content-type"] contains "application/json"
```

#### Variable Capture
```flow
> capture token = body.access_token
> capture userId = body.user.id
> capture firstUser = body.users[0].name
```

### Variable Substitution

Use captured variables or environment variables:

```flow
### Login
POST https://api.example.com/auth/login
Content-Type: application/json

{
  "email": "{{email}}",
  "password": "{{password}}"
}

> capture token = body.token

### Protected Request
GET https://api.example.com/profile
Authorization: Bearer {{token}}
```

## Environment Variables

Create a `.env` file:

```env
BASE_URL=https://api.staging.example.com
API_KEY=your-secret-key
EMAIL=test@example.com
PASSWORD=test123
```

Use in flows:

```flow
### API Call
GET {{BASE_URL}}/data
X-API-Key: {{API_KEY}}
```

Run with environment:

```bash
restflow run flows/ --env .env.staging
```

## CLI Options

```bash
# Basic usage
restflow run flow.flow

# Multiple flows
restflow run flows/

# With environment
restflow run flows/ --env .env.staging

# Different output formats
restflow run flows/ --format json
restflow run flows/ --format summary

# Verbose output
restflow run flows/ --verbose

# Show request/response details
restflow run flows/ --show-body --show-headers

# Custom timeout
restflow run flows/ --timeout 10000
```

## Output Formats

### Console (Default)
Colored, human-readable output with progress indicators.

### JSON
Machine-readable output for CI/CD integration:

```bash
restflow run flows/ --format json > results.json
```

### Summary
Concise tabular output:

```bash
restflow run flows/ --format summary
```

## Development

This project uses Nx monorepo architecture:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm nx run-many -t build --all

# Run tests
pnpm nx run-many -t test --all

# Build CLI
pnpm nx build cli
```

### Package Structure

- `@restflow/cli` - Command line interface
- `@restflow/parser` - Flow file parser
- `@restflow/engine` - Flow execution engine
- `@restflow/http` - HTTP client
- `@restflow/variables` - Variable resolution
- `@restflow/environment` - Environment loading
- `@restflow/assertions` - Response validation
- `@restflow/reporter` - Output formatting
- `@restflow/types` - TypeScript definitions
- `@restflow/utils` - Shared utilities

## Examples

Check out the [examples/basic](./examples/basic) directory for a complete working example with:

- Express.js server with authentication
- Health check flows
- User registration and login flows
- JWT token handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built for API testing and automation**
