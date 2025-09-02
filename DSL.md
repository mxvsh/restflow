# Restflow DSL Specification

Restflow uses a custom Domain Specific Language (DSL) for defining API test flows in `.flow` files. This document provides a comprehensive specification of the DSL syntax for Large Language Models (LLMs) to understand and generate valid flow files.

## File Structure

A `.flow` file consists of multiple steps, each defined with a specific format:

```
### Step Name
METHOD /endpoint
Header-Name: Header-Value
Content-Type: application/json

{request body}

> assert status == 200
> capture token = body.token
```

## Core Components

### 1. Step Declaration

Each step must begin with a level-3 markdown header:

```
### Step Name
```

- **Required**: Yes
- **Format**: `### ` followed by step name
- **Purpose**: Defines a logical test step
- **Example**: `### Login User`, `### Get Health Status`

### 2. HTTP Method and Endpoint

The first non-comment line after the step declaration defines the HTTP request:

```
METHOD /endpoint
```

- **Supported Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Endpoint Format**: Must start with `/` or be a full URL
- **Variables**: Support `{{variable}}` substitution
- **BASE_URL Support**: Relative URLs are automatically prefixed with `BASE_URL` from environment
- **Examples**:
  - `GET /health` (uses BASE_URL if set)
  - `POST /auth/login` (uses BASE_URL if set)
  - `PUT /users/{{userId}}` (uses BASE_URL if set)
  - `GET https://api.example.com/data` (absolute URL, ignores BASE_URL)
  - `GET {{baseUrl}}/api/data` (variable resolution)

### 3. Headers (Optional)

Headers are defined as key-value pairs, one per line:

```
Header-Name: Header-Value
```

- **Format**: `Key: Value`
- **Case Sensitivity**: Header names are case-insensitive
- **Variables**: Support `{{variable}}` substitution
- **Common Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
  - `X-API-Key: {{apiKey}}`

### 4. Request Body (Optional)

Request body follows headers, separated by a blank line:

```json
{
  "username": "{{username}}",
  "password": "{{password}}"
}
```

- **Format**: JSON, XML, or plain text
- **Variables**: Support `{{variable}}` substitution
- **Content-Type**: Should match the Content-Type header

### 5. Assertions

Assertions validate the response using the `> assert` directive:

```
> assert condition
```

#### Available Assertion Types:

**Status Code**:
```
> assert status == 200
> assert status != 404
> assert status >= 200
> assert status < 300
```

**Response Body (JSONPath)**:
```
> assert body.success == true
> assert body.data.length > 0
> assert body.user.email == "{{expectedEmail}}"
```

**Response Headers**:
```
> assert headers["content-type"] == "application/json"
> assert headers.authorization != null
```

**Regular Expressions**:
```
> assert body.message matches "^Success"
> assert body.id matches "\\d+"
```

**Existence Checks**:
```
> assert body.token != null
> assert body.error == null
```

### 6. Variable Capture

Capture values from responses using the `> capture` directive:

```
> capture variableName = expression
```

#### Capture Sources:

**From Response Body**:
```
> capture token = body.token
> capture userId = body.user.id
> capture count = body.data.length
```

**From Response Headers**:
```
> capture sessionId = headers["x-session-id"]
> capture location = headers.location
```

**From Status Code**:
```
> capture statusCode = status
```

## Variable System

### Variable Declaration

Variables can be defined in several ways:

1. **Environment Variables**: Loaded from `.env` files
2. **Captured Variables**: Extracted from previous responses
3. **Built-in Variables**: System-provided variables
4. **CLI Variables**: Passed via command line arguments

### Variable Usage

Variables are referenced using double curly braces:

```
{{variableName}}
```

#### Examples:
```
GET /users/{{userId}}
Authorization: Bearer {{token}}

{
  "name": "{{userName}}",
  "email": "{{userEmail}}"
}

> assert body.id == "{{expectedId}}"
```

### Built-in Variables

Built-in variables generate dynamic values and are always available:

- `{{uuid}}`: Generated UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- `{{timestamp}}`: Current Unix timestamp (e.g., `1609459200`)
- `{{randomString}}`: Random alphanumeric string (e.g., `abc123def`)
- `{{randomNumber}}`: Random number 0-999999 (e.g., `42317`)

**Important**: Each use of a built-in variable generates a unique value. If you need consistency, capture the value first:

```flow
### Step 1
GET /api/data
X-Request-ID: {{uuid}}

> capture requestId = headers["x-request-id"]

### Step 2 - Use captured value for consistency
POST /api/logs
X-Related-Request: {{requestId}}
```

### Environment Variables and Chaining

Environment variables support variable references and built-in variables:

**.env file**:
```env
# Basic variables
BASE_URL=https://api.example.com
API_KEY=secret123

# Built-in variables in environment
USER_ID=user-{{randomString}}
SESSION_ID=session-{{uuid}}

# Variable chaining
EMAIL={{USER_ID}}@example.com
LOG_PATH=/logs/{{SESSION_ID}}.log

# Dynamic BASE_URL
BASE_URL=https://{{environment}}.api.com
environment=staging
```

**Variable Resolution Priority** (highest to lowest):
1. CLI variables (passed via command line)
2. Captured variables (from previous responses)
3. Environment variables (from .env files)
4. Built-in variables (generated dynamically)

### BASE_URL Support

When `BASE_URL` is defined in your environment file, relative URLs in flows are automatically prefixed:

**.env**:
```env
BASE_URL=https://api.example.com
```

**Flow**:
```flow
### Uses BASE_URL - becomes https://api.example.com/users
GET /users

### Absolute URL - ignores BASE_URL
GET https://other-api.com/data

### Variable in BASE_URL works too
GET /posts/{{postId}}
```

**Dynamic BASE_URL**:
```env
BASE_URL=https://{{env}}.example.com
env=staging
# Results in: https://staging.example.com
```

## Comments

Comments are supported using the `#` symbol:

```
# This is a comment
### Step Name
# Another comment
GET /endpoint
```

- Comments are ignored during parsing
- Can appear anywhere in the file
- Must start with `#` at the beginning of a line

## Complete Examples

### Basic Example with Built-in Variables

**.env**:
```env
BASE_URL=https://jsonplaceholder.typicode.com
API_KEY=secret123
```

**Flow**:
```flow
# API Testing with Built-in Variables

### Create Post with Dynamic Data
POST /posts
Content-Type: application/json
X-Request-ID: {{uuid}}
X-Timestamp: {{timestamp}}

{
  "title": "Test Post {{randomString}}",
  "body": "Generated at {{timestamp}}",
  "userId": {{randomNumber}}
}

> assert status == 201
> assert body.id != null
> capture postId = body.id

### Get Created Post
GET /posts/{{postId}}
X-Request-ID: {{uuid}}

> assert status == 200
> assert body.title contains "Test Post"
```

### Advanced Example with Variable Chaining

**.env**:
```env
# Environment setup
BASE_URL=https://{{environment}}.api.example.com
environment=staging

# User setup with chaining
USER_PREFIX=user-{{randomString}}
USER_EMAIL={{USER_PREFIX}}@example.com
SESSION_ID=session-{{uuid}}

# API configuration
API_VERSION=v1
ENDPOINT_BASE={{BASE_URL}}/{{API_VERSION}}
```

**Flow**:
```flow
# User Registration and Login Flow

### Register New User
POST /auth/register
Content-Type: application/json
X-Session-ID: {{SESSION_ID}}

{
  "username": "{{USER_PREFIX}}",
  "email": "{{USER_EMAIL}}",
  "password": "password123"
}

> assert status == 201
> assert body.success == true
> capture userId = body.user.id

### Login User
POST /auth/login
Content-Type: application/json
X-Session-ID: {{SESSION_ID}}

{
  "email": "{{USER_EMAIL}}",
  "password": "password123"
}

> assert status == 200
> assert body.token != null
> capture token = body.token

### Get User Profile
GET /users/{{userId}}
Authorization: Bearer {{token}}
X-Session-ID: {{SESSION_ID}}

> assert status == 200
> assert body.id == "{{userId}}"
> assert body.email == "{{USER_EMAIL}}"

### Update User Profile
PUT /users/{{userId}}
Authorization: Bearer {{token}}
Content-Type: application/json
X-Session-ID: {{SESSION_ID}}

{
  "name": "Updated Name {{timestamp}}"
}

> assert status == 200
> assert body.name contains "Updated Name"
```

## Best Practices for LLMs

### 1. Step Naming
- Use descriptive, action-oriented names
- Follow verb-noun pattern: "Create User", "Get Orders"
- Be specific: "Login Admin User" vs "Login User"

### 2. Variable Naming
- Use camelCase: `userId`, `accessToken`
- Be descriptive: `userEmail` vs `email`
- Avoid conflicts with built-in variables (`uuid`, `timestamp`, `randomString`, `randomNumber`)
- Use meaningful prefixes for environment chaining: `USER_ID`, `SESSION_TOKEN`

### 3. Assertion Strategy
- Always assert status codes
- Validate critical response fields
- Use specific assertions over generic ones
- Assert both positive and negative cases

### 4. Flow Organization
- Logical step ordering (setup → action → verification)
- Capture variables before they're needed
- Group related operations
- Use meaningful step names
- Leverage BASE_URL for environment portability
- Use environment variable chaining for complex setups

### 5. Error Handling
- Assert expected error codes
- Validate error message format
- Test edge cases and boundaries

### 6. Environment Setup
- Use BASE_URL for API endpoint configuration
- Chain variables for complex dynamic values
- Separate environment-specific values into different .env files
- Use built-in variables for unique test data generation

### 7. Built-in Variable Usage
- Capture built-in variables if you need consistency across steps
- Use `{{uuid}}` for unique identifiers
- Use `{{timestamp}}` for time-based testing
- Use `{{randomString}}` and `{{randomNumber}}` for dynamic test data

## Common Patterns

### Authentication Flow
```flow
### Login
POST /auth/login
Content-Type: application/json

{"email": "{{email}}", "password": "{{password}}"}

> assert status == 200
> capture token = body.token

### Authenticated Request
GET /protected/resource
Authorization: Bearer {{token}}

> assert status == 200
```

### CRUD Operations
```flow
### Create Resource
POST /resources
Content-Type: application/json

{"name": "Test Resource"}

> assert status == 201
> capture resourceId = body.id

### Read Resource
GET /resources/{{resourceId}}

> assert status == 200
> assert body.name == "Test Resource"

### Update Resource
PUT /resources/{{resourceId}}
Content-Type: application/json

{"name": "Updated Resource"}

> assert status == 200

### Delete Resource
DELETE /resources/{{resourceId}}

> assert status == 204
```

### Pagination Testing
```flow
### Get First Page
GET /items?page=1&limit=10

> assert status == 200
> assert body.data.length <= 10
> capture totalPages = body.pagination.totalPages

### Get Last Page
GET /items?page={{totalPages}}&limit=10

> assert status == 200
> assert body.pagination.currentPage == {{totalPages}}
```

This DSL specification provides LLMs with comprehensive guidance for understanding and generating valid Restflow test files.