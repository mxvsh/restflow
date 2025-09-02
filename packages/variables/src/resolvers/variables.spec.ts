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
});
