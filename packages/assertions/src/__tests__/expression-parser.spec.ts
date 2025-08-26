import { describe, expect, it } from "vitest";
import { ExpressionParseError, ExpressionParser } from "../parsers/expression-parser";

describe("ExpressionParser", () => {
	const parser = new ExpressionParser();

	describe("parse", () => {
		it("should parse equality assertion", () => {
			const result = parser.parse("status == 200");
			expect(result).toEqual({
				left: "status",
				operator: "==",
				right: 200,
			});
		});

		it("should parse inequality assertion", () => {
			const result = parser.parse("status != 404");
			expect(result).toEqual({
				left: "status",
				operator: "!=",
				right: 404,
			});
		});

		it("should parse greater than assertion", () => {
			const result = parser.parse("responseTime < 1000");
			expect(result).toEqual({
				left: "responseTime",
				operator: "<",
				right: 1000,
			});
		});

		it("should parse greater than or equal assertion", () => {
			const result = parser.parse("body.count >= 10");
			expect(result).toEqual({
				left: "body.count",
				operator: ">=",
				right: 10,
			});
		});

		it("should parse contains assertion", () => {
			const result = parser.parse('body.message contains "success"');
			expect(result).toEqual({
				left: "body.message",
				operator: "contains",
				right: "success",
			});
		});

		it("should parse not_contains assertion", () => {
			const result = parser.parse('body.error not_contains "failed"');
			expect(result).toEqual({
				left: "body.error",
				operator: "not_contains",
				right: "failed",
			});
		});

		it("should parse matches assertion with regex", () => {
			const result = parser.parse(
				'headers.content-type matches "application/json"',
			);
			expect(result).toEqual({
				left: "headers.content-type",
				operator: "matches",
				right: "application/json",
			});
		});

		it("should parse exists assertion", () => {
			const result = parser.parse("body.data exists");
			expect(result).toEqual({
				left: "body.data",
				operator: "exists",
				right: "",
			});
		});

		it("should parse not_exists assertion", () => {
			const result = parser.parse("body.error not_exists");
			expect(result).toEqual({
				left: "body.error",
				operator: "not_exists",
				right: "",
			});
		});

		it("should parse string values with quotes", () => {
			const result = parser.parse('statusText == "OK"');
			expect(result).toEqual({
				left: "statusText",
				operator: "==",
				right: "OK",
			});
		});

		it("should parse boolean values", () => {
			const result = parser.parse("body.success == true");
			expect(result).toEqual({
				left: "body.success",
				operator: "==",
				right: true,
			});
		});

		it("should parse null values", () => {
			const result = parser.parse("body.error == null");
			expect(result).toEqual({
				left: "body.error",
				operator: "==",
				right: null,
			});
		});

		it("should parse decimal numbers", () => {
			const result = parser.parse("body.price >= 19.99");
			expect(result).toEqual({
				left: "body.price",
				operator: ">=",
				right: 19.99,
			});
		});

		it("should handle whitespace around operators", () => {
			const result = parser.parse("  status   ==   200  ");
			expect(result).toEqual({
				left: "status",
				operator: "==",
				right: 200,
			});
		});

		it("should throw error for invalid expression", () => {
			expect(() => parser.parse("invalid expression")).toThrow(
				ExpressionParseError,
			);
		});

		it("should throw error for expression without operator", () => {
			expect(() => parser.parse("status")).toThrow(ExpressionParseError);
		});
	});
});
