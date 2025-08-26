import { describe, expect, it } from "vitest";
import { parseFlow } from "../parsers/parser.js";

describe("parseFlow", () => {
	it("should parse a simple GET request", () => {
		const content = `
### Get Users
GET https://api.example.com/users
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.name).toBe("Get Users");
		expect(step.request.method).toBe("GET");
		expect(step.request.url).toBe("https://api.example.com/users");
		expect(step.directives).toHaveLength(0);
	});

	it("should parse a POST request with headers and JSON body", () => {
		const content = `
### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json
Authorization: Bearer temp-token

{
  "username": "testuser",
  "password": "password123"
}
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.name).toBe("Login");
		expect(step.request.method).toBe("POST");
		expect(step.request.url).toBe("{{baseUrl}}/auth/login");
		expect(step.request.headers).toEqual({
			"Content-Type": "application/json",
			Authorization: "Bearer temp-token",
		});
		expect(step.request.body).toContain('"username": "testuser"');
		expect(step.request.body).toContain('"password": "password123"');
	});

	it("should parse capture directives", () => {
		const content = `
### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{"username": "test", "password": "pass"}

> capture token = $.data.access_token
> capture userId = $.user.id
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.directives).toHaveLength(2);

		expect(step.directives[0]).toEqual({
			type: "capture",
			variable: "token",
			expression: "$.data.access_token",
		});

		expect(step.directives[1]).toEqual({
			type: "capture",
			variable: "userId",
			expression: "$.user.id",
		});
	});

	it("should parse assert directives", () => {
		const content = `
### Get Profile
GET {{baseUrl}}/me
Authorization: Bearer {{token}}

> assert status == 200
> assert body.name == "John Doe"
> assert headers.content-type == "application/json"
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.directives).toHaveLength(3);

		expect(step.directives[0]).toEqual({
			type: "assert",
			expression: "status == 200",
		});

		expect(step.directives[1]).toEqual({
			type: "assert",
			expression: 'body.name == "John Doe"',
		});

		expect(step.directives[2]).toEqual({
			type: "assert",
			expression: 'headers.content-type == "application/json"',
		});
	});

	it("should parse multiple steps", () => {
		const content = `
### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{"username": "test", "password": "pass"}

> capture token = $.data.token

### Get Profile
GET {{baseUrl}}/me
Authorization: Bearer {{token}}

> assert status == 200
> assert body.id == 123

### Update Profile
PUT {{baseUrl}}/me
Authorization: Bearer {{token}}
Content-Type: application/json

{"name": "Updated Name"}

> assert status == 200
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(3);

		// Check first step
		expect(result.flow.steps[0].name).toBe("Login");
		expect(result.flow.steps[0].request.method).toBe("POST");
		expect(result.flow.steps[0].directives).toHaveLength(1);
		expect(result.flow.steps[0].directives[0].type).toBe("capture");

		// Check second step
		expect(result.flow.steps[1].name).toBe("Get Profile");
		expect(result.flow.steps[1].request.method).toBe("GET");
		expect(result.flow.steps[1].directives).toHaveLength(2);
		expect(result.flow.steps[1].directives[0].type).toBe("assert");

		// Check third step
		expect(result.flow.steps[2].name).toBe("Update Profile");
		expect(result.flow.steps[2].request.method).toBe("PUT");
		expect(result.flow.steps[2].directives).toHaveLength(1);
	});

	it("should handle various HTTP methods", () => {
		const content = `
### Get
GET /api/users

### Post
POST /api/users

### Put
PUT /api/users/1

### Delete
DELETE /api/users/1

### Patch
PATCH /api/users/1

### Head
HEAD /api/users

### Options
OPTIONS /api/users
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(7);

		const methods = result.flow.steps.map((step) => step.request.method);
		expect(methods).toEqual([
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"HEAD",
			"OPTIONS",
		]);
	});

	it("should handle empty sections gracefully", () => {
		const content = `
### Valid Step
GET /api/test

###


### Another Valid Step
POST /api/test
`;

		const result = parseFlow(content);

		// The empty section should be filtered out, so no errors
		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(2);
		expect(result.flow.steps[0].name).toBe("Valid Step");
		expect(result.flow.steps[1].name).toBe("Another Valid Step");
	});

	it("should handle invalid HTTP methods", () => {
		const content = `
### Invalid Method
INVALID /api/test
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("Invalid HTTP method: INVALID");
		expect(result.flow.steps).toHaveLength(0);
	});

	it("should handle malformed request lines", () => {
		const content = `
### Missing URL
GET

### Missing Method
/api/test
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(2);
		expect(result.errors[0]).toContain("Invalid request line");
		expect(result.errors[1]).toContain("Invalid request line");
		expect(result.flow.steps).toHaveLength(0);
	});

	it("should parse complex JSON bodies", () => {
		const content = `
### Create User
POST /api/users
Content-Type: application/json

{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "tags": ["admin", "developer"]
  }
}
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		const body = JSON.parse(step.request.body!);
		expect(body.user.name).toBe("John Doe");
		expect(body.user.preferences.theme).toBe("dark");
		expect(body.user.tags).toEqual(["admin", "developer"]);
	});

	it("should handle steps without headers or body", () => {
		const content = `
### Simple Get
GET /api/status

> assert status == 200
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.request.headers).toBeUndefined();
		expect(step.request.body).toBeUndefined();
		expect(step.directives).toHaveLength(1);
	});

	it("should handle mixed capture and assert directives", () => {
		const content = `
### Mixed Directives
POST /api/login

{"username": "test"}

> capture token = $.token
> assert status == 201
> capture refreshToken = $.refresh_token
> assert body.success == true
`;

		const result = parseFlow(content);

		expect(result.errors).toHaveLength(0);
		expect(result.flow.steps).toHaveLength(1);

		const step = result.flow.steps[0];
		expect(step.directives).toHaveLength(4);

		expect(step.directives[0]).toEqual({
			type: "capture",
			variable: "token",
			expression: "$.token",
		});

		expect(step.directives[1]).toEqual({
			type: "assert",
			expression: "status == 201",
		});

		expect(step.directives[2]).toEqual({
			type: "capture",
			variable: "refreshToken",
			expression: "$.refresh_token",
		});

		expect(step.directives[3]).toEqual({
			type: "assert",
			expression: "body.success == true",
		});
	});
});
