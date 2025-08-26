# Restflow Basic Examples

This directory contains comprehensive examples demonstrating Restflow's capabilities for API testing using `.flow` files.

## Project Structure

```
examples/basic/
├── package.json          # Project configuration and scripts
├── environments/         # Environment configurations
│   ├── .env.dev          # Development environment
│   ├── .env.test         # Test environment
│   └── .env.prod         # Production environment
├── flows/                # Flow test files
│   ├── 01-health-check.flow       # Basic health check
│   ├── 02-user-authentication.flow # Login and auth flow
│   ├── 03-product-management.flow  # CRUD operations
│   ├── 04-error-handling.flow     # Error scenarios
│   └── 05-advanced-assertions.flow # Complex assertions
└── README.md             # This file
```

## Getting Started

### Prerequisites

Make sure you have the Restflow CLI installed:

```bash
npm install -g @restflow/cli
# or use from monorepo root
pnpm build && pnpm link --global packages/cli
```

### Running Examples

1. **Run all flows with development environment:**
   ```bash
   npm run dev
   # or manually: restflow run flows/ --env environments/.env.dev
   ```

2. **Run specific flow:**
   ```bash
   restflow run flows/01-health-check.flow --env environments/.env.dev
   ```

3. **Run with different output formats:**
   ```bash
   # Pretty console output (default)
   restflow run flows/ --env environments/.env.dev

   # JSON output for CI/CD
   restflow run flows/ --env environments/.env.dev --json

   # Summary table format
   restflow run flows/ --env environments/.env.dev --format summary
   ```

4. **Verbose output with request/response details:**
   ```bash
   restflow run flows/ --env environments/.env.dev --verbose --show-headers --show-body
   ```

## Flow Examples Explained

### 1. Health Check (`01-health-check.flow`)

Basic API health verification:
- Server health endpoint validation
- JSON response structure assertions
- Header content type verification
- Basic variable capture

**Key Features:**
- Simple GET requests
- Basic assertions (`status`, `body`, `headers`)
- Variable capture with `@capture`

### 2. User Authentication (`02-user-authentication.flow`)

Complete authentication workflow:
- User login with credentials
- Token capture and reuse
- Authenticated requests
- Profile management

**Key Features:**
- POST requests with JSON body
- Environment variable usage (`{{TEST_USERNAME}}`)
- Token-based authentication
- Sequential request dependencies

### 3. Product Management (`03-product-management.flow`)

Full CRUD operations demonstration:
- Authentication setup
- Create, read, update, delete operations
- Search functionality
- Cleanup verification

**Key Features:**
- Complex request sequences
- ID capture and reuse
- REST API patterns
- Data validation across requests

### 4. Error Handling (`04-error-handling.flow`)

Error scenario testing:
- 404 Not Found responses
- Invalid request data
- Authentication failures
- Performance limits

**Key Features:**
- HTTP error status validation
- Error message verification
- Response time assertions
- Edge case testing

### 5. Advanced Assertions (`05-advanced-assertions.flow`)

Complex assertion patterns:
- JSONPath queries
- Regular expression matching
- Array and object validation
- Conditional logic

**Key Features:**
- Advanced JSONPath syntax
- Pattern matching with regex
- Complex data structure validation
- Environment-specific assertions

## Environment Variables

Each environment file (`.env.dev`, `.env.test`, `.env.prod`) contains:

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | API base URL | `http://localhost:3000` |
| `API_KEY` | API authentication key | `dev-api-key-12345` |
| `TIMEOUT` | Request timeout (ms) | `5000` |
| `DEBUG` | Debug mode flag | `true` |
| `TEST_USERNAME` | Test user credentials | `dev_user` |
| `TEST_PASSWORD` | Test user password | `dev_password123` |
| `ENABLE_LOGGING` | Logging feature flag | `true` |
| `RATE_LIMIT` | Rate limit setting | `100` |

## Common Assertion Patterns

### Status Code Assertions
```
@assert status == 200
@assert status >= 200
@assert status < 300
```

### Response Body Assertions
```
@assert body.success == true
@assert body.data exists
@assert body.items.length > 0
@assert body.message contains "success"
```

### Header Assertions
```
@assert headers.content-type == "application/json"
@assert headers.authorization exists
@assert headers.x-rate-limit matches "\\d+"
```

### JSONPath Assertions
```
@assert body.users[0].email contains "@"
@assert body.products[*].id exists
@assert body.items[?(@.active == true)] exists
```

### Variable Capture
```
@capture token body.accessToken
@capture userId body.user.id
@capture items body.data[*].id
```

## Output Formats

### Pretty Console (Default)
Colored, human-readable output with progress indicators and detailed results.

### JSON Format (`--json`)
Machine-readable JSON output suitable for CI/CD integration:
```json
{
  "success": true,
  "duration": 1250,
  "summary": {
    "steps": { "total": 5, "passed": 5, "failed": 0 },
    "directives": { "total": 15, "passed": 15, "failed": 0 }
  }
}
```

### Summary Format (`--format summary`)
Concise table format showing key metrics for each step.

## Testing Tips

1. **Start Simple:** Begin with health check flows before complex scenarios
2. **Use Variables:** Leverage environment variables for different test environments
3. **Capture & Reuse:** Capture IDs and tokens for subsequent requests
4. **Validate Everything:** Assert status codes, response structure, and business logic
5. **Handle Errors:** Include negative test cases and error scenarios
6. **Performance Testing:** Use response time assertions for performance validation

## Troubleshooting

### Common Issues

1. **Connection Refused:**
   - Ensure the API server is running
   - Check the `BASE_URL` in your environment file

2. **Authentication Failures:**
   - Verify `TEST_USERNAME` and `TEST_PASSWORD` are correct
   - Check if the authentication endpoint is available

3. **Assertion Failures:**
   - Use `--verbose` flag to see full request/response details
   - Check JSONPath syntax for complex assertions
   - Verify environment variables are loaded correctly

### Debug Mode

Run with maximum verbosity to troubleshoot issues:
```bash
restflow run flows/ --env environments/.env.dev --verbose --show-headers --show-body
```

## Advanced Usage

### Custom Headers
```
GET {{BASE_URL}}/api/endpoint
Authorization: Bearer {{token}}
X-Custom-Header: custom-value
User-Agent: Restflow/1.0
```

### Complex JSON Bodies
```
POST {{BASE_URL}}/api/endpoint
Content-Type: application/json

{
  "user": {
    "name": "{{TEST_USERNAME}}",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "metadata": {
    "source": "restflow",
    "timestamp": "{{CURRENT_TIME}}"
  }
}
```

### Conditional Assertions
```
# Only assert debug features in development
@assert body.debugInfo exists
@assert body.debugInfo.enabled == {{DEBUG}}
```

## Integration with CI/CD

Use JSON output format for automated testing:

```bash
# GitHub Actions example
- name: Run API Tests
  run: restflow run flows/ --env environments/.env.test --json > test-results.json
  
- name: Check Results
  run: |
    if [[ $(jq -r '.success' test-results.json) != "true" ]]; then
      exit 1
    fi
```

This example project demonstrates the full power of Restflow for API testing, from simple health checks to complex business workflows with comprehensive validation.