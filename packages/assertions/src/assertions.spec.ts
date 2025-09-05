import type { HttpResponse } from "@restflow/types";
import { describe, expect, it } from "vitest";
import { DefaultAssertionEvaluator } from "./evaluators/assertion-evaluator";
import { DefaultValueExtractor } from "./extractors/value-extractor";
import { ExpressionParser } from "./parsers/expression-parser";

describe("ExpressionParser", () => {
	const parser = new ExpressionParser();

	it("should parse a simple equality expression", () => {
		const result = parser.parse("status == 200");
		expect(result).toEqual({
			left: "status",
			operator: "==",
			right: 200,
		});
	});

	it("should parse a contains expression with a string", () => {
		const result = parser.parse('body.message contains "success"');
		expect(result).toEqual({
			left: "body.message",
			operator: "contains",
			right: "success",
		});
	});

	it("should throw an error for an invalid expression", () => {
		expect(() => parser.parse("status is 200")).toThrow(
			"Invalid assertion expression: status is 200",
		);
	});
});

describe("DefaultValueExtractor", () => {
	const extractor = new DefaultValueExtractor();
	const response: HttpResponse = {
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ message: "success", data: { id: 123 } }),
		responseTime: 100,
	};

	it("should extract the status code", () => {
		const value = extractor.extract("status", response);
		expect(value).toBe(200);
	});

	it("should extract a header", () => {
		const value = extractor.extract("headers.content-type", response);
		expect(value).toBe("application/json");
	});

	it("should extract a value from the body using JSONPath", () => {
		const value = extractor.extract("body.data.id", response);
		expect(value).toBe(123);
	});

	it("should extract a cookie from Set-Cookie header", () => {
		const responseWithCookies: HttpResponse = {
			status: 200,
			statusText: "OK",
			headers: {
				"content-type": "application/json",
				"set-cookie": "sessionId=abc123; Path=/; HttpOnly",
			},
			body: JSON.stringify({ message: "success" }),
			responseTime: 100,
		};

		const value = extractor.extract("cookies.sessionId", responseWithCookies);
		expect(value).toBe("abc123");
	});

	it("should extract a cookie with special characters", () => {
		const responseWithCookies: HttpResponse = {
			status: 200,
			statusText: "OK",
			headers: {
				"content-type": "application/json",
				"set-cookie":
					"token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9; Path=/api; Secure",
			},
			body: JSON.stringify({ message: "success" }),
			responseTime: 100,
		};

		const value = extractor.extract("cookies.token", responseWithCookies);
		expect(value).toBe("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9");
	});

	it("should return undefined for non-existent cookie", () => {
		const responseWithCookies: HttpResponse = {
			status: 200,
			statusText: "OK",
			headers: {
				"content-type": "application/json",
				"set-cookie": "sessionId=abc123; Path=/",
			},
			body: JSON.stringify({ message: "success" }),
			responseTime: 100,
		};

		const value = extractor.extract("cookies.nonExistent", responseWithCookies);
		expect(value).toBeUndefined();
	});

	it("should return undefined when no Set-Cookie header exists", () => {
		const value = extractor.extract("cookies.sessionId", response);
		expect(value).toBeUndefined();
	});
});

describe("DefaultAssertionEvaluator", () => {
	const evaluator = new DefaultAssertionEvaluator();
	const response: HttpResponse = {
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ message: "success" }),
		responseTime: 100,
	};

	it("should return true for a correct equality assertion", () => {
		const result = evaluator.evaluate("status == 200", response);
		expect(result.passed).toBe(true);
	});

	it("should return false for an incorrect equality assertion", () => {
		const result = evaluator.evaluate("status == 404", response);
		expect(result.passed).toBe(false);
	});

	it('should return true for a correct "contains" assertion', () => {
		const result = evaluator.evaluate(
			'body.message contains "success"',
			response,
		);
		expect(result.passed).toBe(true);
	});
});
