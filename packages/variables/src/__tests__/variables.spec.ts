import type { ExecutionContext, HttpRequest } from "@restflow/types";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createExecutionContext,
	DefaultVariableResolver,
	extractVariables,
	hasVariables,
	resolveTemplate,
	VariableError,
	validateVariables,
} from "../resolvers/variables";

describe("DefaultVariableResolver", () => {
	let resolver: DefaultVariableResolver;
	let context: ExecutionContext;

	beforeEach(() => {
		resolver = new DefaultVariableResolver();
		context = {
			variables: {
				baseUrl: "https://api.example.com",
				token: "abc123",
				userId: "456",
			},
			responses: [],
		};
	});

	describe("resolve", () => {
		it("should resolve single variable", () => {
			const template = "Hello {{name}}!";
			const testContext = { variables: { name: "World" }, responses: [] };

			expect(resolver.resolve(template, testContext)).toBe("Hello World!");
		});

		it("should resolve multiple variables", () => {
			const template = "{{baseUrl}}/users/{{userId}}";

			expect(resolver.resolve(template, context)).toBe(
				"https://api.example.com/users/456",
			);
		});

		it("should resolve variables in different positions", () => {
			const template = "{{protocol}}://{{host}}/{{path}}";
			const testContext = {
				variables: {
					protocol: "https",
					host: "api.test.com",
					path: "v1/users",
				},
				responses: [],
			};

			expect(resolver.resolve(template, testContext)).toBe(
				"https://api.test.com/v1/users",
			);
		});

		it("should handle no variables", () => {
			const template = "https://api.example.com/users";

			expect(resolver.resolve(template, context)).toBe(
				"https://api.example.com/users",
			);
		});

		it("should throw error for undefined variable", () => {
			const template = "Hello {{unknownVar}}!";

			expect(() => resolver.resolve(template, context)).toThrow(VariableError);
			expect(() => resolver.resolve(template, context)).toThrow(
				"Variable 'unknownVar' is not defined",
			);
		});

		it("should handle same variable used multiple times", () => {
			const template = "{{token}}-{{token}}-{{token}}";

			expect(resolver.resolve(template, context)).toBe("abc123-abc123-abc123");
		});

		it("should resolve built-in uuid variable", () => {
			const template = "id-{{uuid}}";
			const result = resolver.resolve(template, { variables: {}, responses: [] });

			expect(result).toMatch(/^id-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		});

		it("should resolve built-in timestamp variable", () => {
			const template = "ts-{{timestamp}}";
			const result = resolver.resolve(template, { variables: {}, responses: [] });

			expect(result).toMatch(/^ts-\d+$/);
			expect(Number(result.split('-')[1])).toBeGreaterThan(0);
		});

		it("should resolve built-in randomString variable", () => {
			const template = "str-{{randomString}}";
			const result = resolver.resolve(template, { variables: {}, responses: [] });

			expect(result).toMatch(/^str-[a-z0-9]+$/);
			expect(result.split('-')[1].length).toBeGreaterThan(0);
		});

		it("should resolve built-in randomNumber variable", () => {
			const template = "num-{{randomNumber}}";
			const result = resolver.resolve(template, { variables: {}, responses: [] });

			expect(result).toMatch(/^num-\d+$/);
			expect(Number(result.split('-')[1])).toBeGreaterThanOrEqual(0);
		});

		it("should allow environment variables to override built-in variables", () => {
			const template = "{{uuid}}-{{timestamp}}";
			const contextWithOverrides = {
				variables: { uuid: "custom-uuid", timestamp: "custom-timestamp" },
				responses: []
			};

			expect(resolver.resolve(template, contextWithOverrides)).toBe("custom-uuid-custom-timestamp");
		});

		it("should generate different values for built-in variables on each call", () => {
			const template = "{{uuid}}";
			const emptyContext = { variables: {}, responses: [] };
			
			const result1 = resolver.resolve(template, emptyContext);
			const result2 = resolver.resolve(template, emptyContext);

			expect(result1).not.toBe(result2);
		});
	});

	describe("resolveRequest", () => {
		it("should resolve URL in request", () => {
			const request: HttpRequest = {
				method: "GET",
				url: "{{baseUrl}}/users/{{userId}}",
			};

			const resolved = resolver.resolveRequest(request, context);

			expect(resolved.url).toBe("https://api.example.com/users/456");
			expect(resolved.method).toBe("GET");
		});

		it("should resolve headers", () => {
			const request: HttpRequest = {
				method: "POST",
				url: "{{baseUrl}}/users",
				headers: {
					Authorization: "Bearer {{token}}",
					"Content-Type": "application/json",
				},
			};

			const resolved = resolver.resolveRequest(request, context);

			expect(resolved.headers).toEqual({
				Authorization: "Bearer abc123",
				"Content-Type": "application/json",
			});
		});

		it("should resolve body", () => {
			const request: HttpRequest = {
				method: "POST",
				url: "{{baseUrl}}/users",
				body: '{"userId": "{{userId}}", "token": "{{token}}"}',
			};

			const resolved = resolver.resolveRequest(request, context);

			expect(resolved.body).toBe('{"userId": "456", "token": "abc123"}');
		});

		it("should resolve variables in header keys", () => {
			const request: HttpRequest = {
				method: "GET",
				url: "{{baseUrl}}/test",
				headers: {
					"{{customHeader}}": "value",
				},
			};

			const testContext = {
				variables: {
					baseUrl: "https://api.test.com",
					customHeader: "X-Custom-Header",
				},
				responses: [],
			};

			const resolved = resolver.resolveRequest(request, testContext);

			expect(resolved.headers).toEqual({
				"X-Custom-Header": "value",
			});
		});

		it("should handle request without headers or body", () => {
			const request: HttpRequest = {
				method: "GET",
				url: "{{baseUrl}}/users",
			};

			const resolved = resolver.resolveRequest(request, context);

			expect(resolved.url).toBe("https://api.example.com/users");
			expect(resolved.headers).toBeUndefined();
			expect(resolved.body).toBeUndefined();
		});
	});
});

describe("utility functions", () => {
	describe("extractVariables", () => {
		it("should extract variables from template", () => {
			const template = "{{baseUrl}}/users/{{userId}}";

			expect(extractVariables(template)).toEqual(["baseUrl", "userId"]);
		});

		it("should handle duplicate variables", () => {
			const template = "{{token}}-{{token}}-{{other}}";

			expect(extractVariables(template)).toEqual(["token", "other"]);
		});

		it("should return empty array for no variables", () => {
			const template = "https://api.example.com/users";

			expect(extractVariables(template)).toEqual([]);
		});
	});

	describe("hasVariables", () => {
		it("should return true when variables present", () => {
			expect(hasVariables("{{baseUrl}}/users")).toBe(true);
			expect(hasVariables("Hello {{name}}")).toBe(true);
		});

		it("should return false when no variables", () => {
			expect(hasVariables("https://api.example.com")).toBe(false);
			expect(hasVariables("Hello World")).toBe(false);
		});
	});

	describe("validateVariables", () => {
		const context: ExecutionContext = {
			variables: { baseUrl: "https://api.test.com", token: "abc123" },
			responses: [],
		};

		it("should return empty array when all variables defined", () => {
			const template = "{{baseUrl}}/users";

			expect(validateVariables(template, context)).toEqual([]);
		});

		it("should return missing variables", () => {
			const template = "{{baseUrl}}/users/{{userId}}";

			expect(validateVariables(template, context)).toEqual(["userId"]);
		});

		it("should return multiple missing variables", () => {
			const template = "{{host}}/{{path}}/{{id}}";

			expect(validateVariables(template, context)).toEqual([
				"host",
				"path",
				"id",
			]);
		});

		it("should not report built-in variables as missing", () => {
			const template = "{{baseUrl}}/{{uuid}}/{{timestamp}}/{{unknownVar}}";

			expect(validateVariables(template, context)).toEqual(["unknownVar"]);
		});
	});

	describe("createExecutionContext", () => {
		it("should merge variables with correct precedence", () => {
			const envVars = { baseUrl: "env-url", common: "env" };
			const capturedVars = { token: "captured-token", common: "captured" };
			const cliVars = { userId: "cli-user", common: "cli" };

			const context = createExecutionContext(envVars, capturedVars, cliVars);

			expect(context.variables).toEqual({
				baseUrl: "env-url",
				token: "captured-token",
				userId: "cli-user",
				common: "cli", // CLI has highest precedence
			});
			expect(context.responses).toEqual([]);
		});

		it("should handle empty inputs", () => {
			const context = createExecutionContext();

			expect(context.variables).toEqual({});
			expect(context.responses).toEqual([]);
		});
	});

	describe("resolveTemplate", () => {
		it("should resolve template using default resolver", () => {
			const template = "Hello {{name}}!";
			const context = { variables: { name: "World" }, responses: [] };

			expect(resolveTemplate(template, context)).toBe("Hello World!");
		});
	});
});
