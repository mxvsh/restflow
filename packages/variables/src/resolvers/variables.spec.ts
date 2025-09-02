import { describe, expect, it } from "vitest";
import {
	createExecutionContext,
	DefaultVariableResolver,
} from "./variables.js";

describe("DefaultVariableResolver", () => {
	const resolver = new DefaultVariableResolver();

	it("should resolve a simple variable", () => {
		const context = createExecutionContext({ name: "Jules" });
		const result = resolver.resolve("Hello, {{name}}!", context);
		expect(result).toBe("Hello, Jules!");
	});

	it("should resolve a built-in variable", () => {
		const context = createExecutionContext();
		const result = resolver.resolve("Your ID is {{uuid}}", context);
		expect(result).toMatch(/Your ID is .+/);
	});

	it("should throw an error for an undefined variable", () => {
		const context = createExecutionContext();
		expect(() => resolver.resolve("Hello, {{name}}!", context)).toThrow(
			"Variable 'name' is not defined",
		);
	});

	it("should resolve variables in a request object", () => {
		const context = createExecutionContext({
			baseUrl: "https://jsonplaceholder.typicode.com",
		});
		const request = {
			method: "GET" as const,
			url: "{{baseUrl}}/user",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe(
			"https://jsonplaceholder.typicode.com/user",
		);
	});

	it("should prefix relative URLs with BASE_URL", () => {
		const context = createExecutionContext({
			BASE_URL: "https://api.example.com",
		});
		const request = {
			method: "GET" as const,
			url: "/api/users",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://api.example.com/api/users");
	});

	it("should handle BASE_URL with trailing slash", () => {
		const context = createExecutionContext({
			BASE_URL: "https://api.example.com/",
		});
		const request = {
			method: "GET" as const,
			url: "/api/users",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://api.example.com/api/users");
	});

	it("should handle relative path without leading slash", () => {
		const context = createExecutionContext({
			BASE_URL: "https://api.example.com",
		});
		const request = {
			method: "GET" as const,
			url: "api/users",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://api.example.com/api/users");
	});

	it("should not prefix absolute URLs with BASE_URL", () => {
		const context = createExecutionContext({
			BASE_URL: "https://api.example.com",
		});
		const request = {
			method: "GET" as const,
			url: "https://different.api.com/users",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://different.api.com/users");
	});

	it("should work with variables in relative URLs and BASE_URL", () => {
		const context = createExecutionContext({
			BASE_URL: "https://{{env}}.example.com",
			env: "staging",
			userId: "123",
		});
		const request = {
			method: "GET" as const,
			url: "/api/users/{{userId}}",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://staging.example.com/api/users/123");
	});

	it("should use relative path as-is when no BASE_URL is set", () => {
		const context = createExecutionContext();
		const request = {
			method: "GET" as const,
			url: "/api/users",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("/api/users");
	});

	it("should handle BASE_URL with HTTPS protocol correctly", () => {
		const context = createExecutionContext({
			BASE_URL: "https://secure.api.com",
		});
		const request = {
			method: "POST" as const,
			url: "/secure/endpoint",
		};
		const resolvedRequest = resolver.resolveRequest(request, context);
		expect(resolvedRequest.url).toBe("https://secure.api.com/secure/endpoint");
	});
});
