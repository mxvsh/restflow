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

ASSERT response.status == 200
CAPTURE token = response.body.token
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
- **Examples**:
  - `GET /health`
  - `POST /auth/login`
  - `PUT /users/{{userId}}`
  - `GET {{baseUrl}}/api/data`

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

Assertions validate the response using the `ASSERT` keyword:

```
ASSERT condition
```

#### Available Assertion Types:

**Status Code**:
```
ASSERT response.status == 200
ASSERT response.status != 404
ASSERT response.status >= 200
ASSERT response.status < 300
```

**Response Body (JSONPath)**:
```
ASSERT response.body.success == true
ASSERT response.body.data.length > 0
ASSERT response.body.user.email == "{{expectedEmail}}"
```

**Response Headers**:
```
ASSERT response.headers["content-type"] == "application/json"
ASSERT response.headers.authorization exists
```

**Regular Expressions**:
```
ASSERT response.body.message matches "^Success"
ASSERT response.body.id matches "\\d+"
```

**Existence Checks**:
```
ASSERT response.body.token exists
ASSERT response.body.error not exists
```

### 6. Variable Capture

Capture values from responses using the `CAPTURE` keyword:

```
CAPTURE variableName = expression
```

#### Capture Sources:

**From Response Body**:
```
CAPTURE token = response.body.token
CAPTURE userId = response.body.user.id
CAPTURE count = response.body.data.length
```

**From Response Headers**:
```
CAPTURE sessionId = response.headers["x-session-id"]
CAPTURE location = response.headers.location
```

**From Status Code**:
```
CAPTURE statusCode = response.status
```

## Variable System

### Variable Declaration

Variables can be defined in several ways:

1. **Environment Variables**: Loaded from `.env` files
2. **Captured Variables**: Extracted from previous responses
3. **Built-in Variables**: System-provided variables

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

ASSERT response.body.id == "{{expectedId}}"
```

### Built-in Variables

- `{{timestamp}}`: Current Unix timestamp
- `{{uuid}}`: Generated UUID v4
- `{{randomString}}`: Random alphanumeric string
- `{{randomNumber}}`: Random number

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

## Complete Example

```flow
# User Registration and Login Flow

### Register New User
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

ASSERT response.status == 201
ASSERT response.body.success == true
CAPTURE userId = response.body.user.id

### Login User
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

ASSERT response.status == 200
ASSERT response.body.token exists
CAPTURE token = response.body.token

### Get User Profile
GET /users/{{userId}}
Authorization: Bearer {{token}}

ASSERT response.status == 200
ASSERT response.body.id == "{{userId}}"
ASSERT response.body.email == "test@example.com"

### Update User Profile
PUT /users/{{userId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Name"
}

ASSERT response.status == 200
ASSERT response.body.name == "Updated Name"
```

## Best Practices for LLMs

### 1. Step Naming
- Use descriptive, action-oriented names
- Follow verb-noun pattern: "Create User", "Get Orders"
- Be specific: "Login Admin User" vs "Login User"

### 2. Variable Naming
- Use camelCase: `userId`, `accessToken`
- Be descriptive: `userEmail` vs `email`
- Avoid conflicts with built-in variables

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

### 5. Error Handling
- Assert expected error codes
- Validate error message format
- Test edge cases and boundaries

## Common Patterns

### Authentication Flow
```flow
### Login
POST /auth/login
Content-Type: application/json

{"email": "{{email}}", "password": "{{password}}"}

ASSERT response.status == 200
CAPTURE token = response.body.token

### Authenticated Request
GET /protected/resource
Authorization: Bearer {{token}}

ASSERT response.status == 200
```

### CRUD Operations
```flow
### Create Resource
POST /resources
Content-Type: application/json

{"name": "Test Resource"}

ASSERT response.status == 201
CAPTURE resourceId = response.body.id

### Read Resource
GET /resources/{{resourceId}}

ASSERT response.status == 200
ASSERT response.body.name == "Test Resource"

### Update Resource
PUT /resources/{{resourceId}}
Content-Type: application/json

{"name": "Updated Resource"}

ASSERT response.status == 200

### Delete Resource
DELETE /resources/{{resourceId}}

ASSERT response.status == 204
```

### Pagination Testing
```flow
### Get First Page
GET /items?page=1&limit=10

ASSERT response.status == 200
ASSERT response.body.data.length <= 10
CAPTURE totalPages = response.body.pagination.totalPages

### Get Last Page
GET /items?page={{totalPages}}&limit=10

ASSERT response.status == 200
ASSERT response.body.pagination.currentPage == {{totalPages}}
```

This DSL specification provides LLMs with comprehensive guidance for understanding and generating valid Restflow test files.