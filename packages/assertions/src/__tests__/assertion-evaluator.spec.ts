import type { HttpResponse } from "@restflow/types";
import { describe, expect, it } from "vitest";
import {
	AssertionEvaluationError,
	DefaultAssertionEvaluator,
} from "../evaluators/assertion-evaluator";

describe("DefaultAssertionEvaluator", () => {
	const evaluator = new DefaultAssertionEvaluator();

	const sampleResponse: HttpResponse = {
		status: 200,
		statusText: "OK",
		headers: {
			"content-type": "application/json",
			"x-request-id": "12345",
		},
		body: JSON.stringify({
			success: true,
			message: "Operation completed successfully",
			data: {
				id: 42,
				name: "Test User",
				email: "test@example.com",
				tags: ["user", "active", "premium"],
			},
			items: [
				{ id: 1, name: "Item 1", price: 10.99 },
				{ id: 2, name: "Item 2", price: 15.5 },
			],
			metadata: null,
		}),
		responseTime: 125,
	};

	describe("evaluate", () => {
		describe("equality operations", () => {
			it("should pass for equal values", () => {
				const result = evaluator.evaluate("status == 200", sampleResponse);
				expect(result).toEqual({
					expression: "status == 200",
					passed: true,
					actual: 200,
					expected: 200,
					operator: "==",
				});
			});

			it("should fail for unequal values", () => {
				const result = evaluator.evaluate("status == 404", sampleResponse);
				expect(result).toEqual({
					expression: "status == 404",
					passed: false,
					actual: 200,
					expected: 404,
					operator: "==",
				});
			});

			it("should pass for not equal values", () => {
				const result = evaluator.evaluate("status != 404", sampleResponse);
				expect(result).toEqual({
					expression: "status != 404",
					passed: true,
					actual: 200,
					expected: 404,
					operator: "!=",
				});
			});
		});

		describe("comparison operations", () => {
			it("should pass for greater than", () => {
				const result = evaluator.evaluate("responseTime > 100", sampleResponse);
				expect(result).toEqual({
					expression: "responseTime > 100",
					passed: true,
					actual: 125,
					expected: 100,
					operator: ">",
				});
			});

			it("should pass for greater than or equal", () => {
				const result = evaluator.evaluate(
					"responseTime >= 125",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "responseTime >= 125",
					passed: true,
					actual: 125,
					expected: 125,
					operator: ">=",
				});
			});

			it("should pass for less than", () => {
				const result = evaluator.evaluate("responseTime < 200", sampleResponse);
				expect(result).toEqual({
					expression: "responseTime < 200",
					passed: true,
					actual: 125,
					expected: 200,
					operator: "<",
				});
			});

			it("should pass for less than or equal", () => {
				const result = evaluator.evaluate(
					"responseTime <= 125",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "responseTime <= 125",
					passed: true,
					actual: 125,
					expected: 125,
					operator: "<=",
				});
			});
		});

		describe("contains operations", () => {
			it("should pass for string contains", () => {
				const result = evaluator.evaluate(
					'body.message contains "successfully"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.message contains "successfully"',
					passed: true,
					actual: "Operation completed successfully",
					expected: "successfully",
					operator: "contains",
				});
			});

			it("should pass for array contains", () => {
				const result = evaluator.evaluate(
					'body.data.tags contains "active"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.data.tags contains "active"',
					passed: true,
					actual: ["user", "active", "premium"],
					expected: "active",
					operator: "contains",
				});
			});

			it("should pass for object contains property", () => {
				const result = evaluator.evaluate(
					'body.data contains "email"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.data contains "email"',
					passed: true,
					actual: {
						id: 42,
						name: "Test User",
						email: "test@example.com",
						tags: ["user", "active", "premium"],
					},
					expected: "email",
					operator: "contains",
				});
			});

			it("should fail for not_contains when value is present", () => {
				const result = evaluator.evaluate(
					'body.message not_contains "successfully"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.message not_contains "successfully"',
					passed: false,
					actual: "Operation completed successfully",
					expected: "successfully",
					operator: "not_contains",
				});
			});
		});

		describe("regex matching", () => {
			it("should pass for regex match", () => {
				const result = evaluator.evaluate(
					'headers.content-type matches "application/.*"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'headers.content-type matches "application/.*"',
					passed: true,
					actual: "application/json",
					expected: "application/.*",
					operator: "matches",
				});
			});

			it("should fail for regex no match", () => {
				const result = evaluator.evaluate(
					'body.message matches "^Error"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.message matches "^Error"',
					passed: false,
					actual: "Operation completed successfully",
					expected: "^Error",
					operator: "matches",
				});
			});

			it("should pass for not_matches when pattern does not match", () => {
				const result = evaluator.evaluate(
					'body.message not_matches "^Error"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.message not_matches "^Error"',
					passed: true,
					actual: "Operation completed successfully",
					expected: "^Error",
					operator: "not_matches",
				});
			});
		});

		describe("existence operations", () => {
			it("should pass for exists when value is present", () => {
				const result = evaluator.evaluate(
					"body.data.name exists",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.data.name exists",
					passed: true,
					actual: "Test User",
					expected: "",
					operator: "exists",
				});
			});

			it("should fail for exists when value is null", () => {
				const result = evaluator.evaluate(
					"body.metadata exists",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.metadata exists",
					passed: false,
					actual: null,
					expected: "",
					operator: "exists",
				});
			});

			it("should pass for not_exists when value is null", () => {
				const result = evaluator.evaluate(
					"body.metadata not_exists",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.metadata not_exists",
					passed: true,
					actual: null,
					expected: "",
					operator: "not_exists",
				});
			});

			it("should fail for not_exists when value is present", () => {
				const result = evaluator.evaluate(
					"body.data.name not_exists",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.data.name not_exists",
					passed: false,
					actual: "Test User",
					expected: "",
					operator: "not_exists",
				});
			});
		});

		describe("error handling", () => {
			it("should handle invalid expression gracefully", () => {
				const result = evaluator.evaluate("invalid expression", sampleResponse);
				expect(result.passed).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.expression).toBe("invalid expression");
			});

			it("should handle extraction errors gracefully", () => {
				const result = evaluator.evaluate(
					'$.invalid.jsonpath == "test"',
					sampleResponse,
				);
				expect(result.passed).toBe(false);
				expect(result.error).toBeDefined();
			});
		});

		describe("type coercion", () => {
			it("should handle numeric comparisons with string numbers", () => {
				const result = evaluator.evaluate(
					'body.data.id > "40"',
					sampleResponse,
				);
				expect(result).toEqual({
					expression: 'body.data.id > "40"',
					passed: true,
					actual: 42,
					expected: "40",
					operator: ">",
				});
			});

			it("should handle boolean comparisons", () => {
				const result = evaluator.evaluate(
					"body.success == true",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.success == true",
					passed: true,
					actual: true,
					expected: true,
					operator: "==",
				});
			});
		});

		describe("complex JSONPath expressions", () => {
			it("should handle array queries", () => {
				const result = evaluator.evaluate(
					"body.items[0].price < 20",
					sampleResponse,
				);
				expect(result).toEqual({
					expression: "body.items[0].price < 20",
					passed: true,
					actual: 10.99,
					expected: 20,
					operator: "<",
				});
			});
		});
	});
});
