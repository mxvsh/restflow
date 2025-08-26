import type { HttpResponse } from "@restflow/types";
import {
	type ComparisonOperator,
	ExpressionParser,
} from "../parsers/expression-parser.js";
import {
	DefaultValueExtractor,
	type ValueExtractor,
} from "../extractors/value-extractor.js";

export interface AssertionResult {
	expression: string;
	passed: boolean;
	actual: unknown;
	expected: unknown;
	operator: ComparisonOperator;
	error?: string;
}

export interface AssertionEvaluator {
	evaluate(expression: string, response: HttpResponse): AssertionResult;
}

export class DefaultAssertionEvaluator implements AssertionEvaluator {
	private parser: ExpressionParser;
	private extractor: ValueExtractor;

	constructor(parser?: ExpressionParser, extractor?: ValueExtractor) {
		this.parser = parser || new ExpressionParser();
		this.extractor = extractor || new DefaultValueExtractor();
	}

	evaluate(expression: string, response: HttpResponse): AssertionResult {
		try {
			const parsed = this.parser.parse(expression);
			const actual = this.extractor.extract(parsed.left, response);
			const passed = this.evaluateComparison(
				actual,
				parsed.operator,
				parsed.right,
			);

			return {
				expression,
				passed,
				actual,
				expected: parsed.right,
				operator: parsed.operator,
			};
		} catch (error) {
			return {
				expression,
				passed: false,
				actual: undefined,
				expected: undefined,
				operator: "==" as ComparisonOperator,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private evaluateComparison(
		actual: unknown,
		operator: ComparisonOperator,
		expected: unknown,
	): boolean {
		switch (operator) {
			case "==":
				return actual === expected;

			case "!=":
				return actual !== expected;

			case ">":
				return Number(actual) > Number(expected);

			case ">=":
				return Number(actual) >= Number(expected);

			case "<":
				return Number(actual) < Number(expected);

			case "<=":
				return Number(actual) <= Number(expected);

			case "contains":
				return this.contains(actual, expected);

			case "not_contains":
				return !this.contains(actual, expected);

			case "matches":
				return this.matches(actual, expected);

			case "not_matches":
				return !this.matches(actual, expected);

			case "exists":
				return actual !== undefined && actual !== null;

			case "not_exists":
				return actual === undefined || actual === null;

			default:
				throw new AssertionEvaluationError(`Unknown operator: ${operator}`);
		}
	}

	private contains(actual: unknown, expected: unknown): boolean {
		if (typeof actual === "string") {
			return actual.includes(String(expected));
		}

		if (Array.isArray(actual)) {
			return actual.includes(expected);
		}

		if (typeof actual === "object" && actual !== null) {
			return Object.hasOwn(actual, String(expected));
		}

		return false;
	}

	private matches(actual: unknown, expected: unknown): boolean {
		try {
			const regex = new RegExp(String(expected));
			return regex.test(String(actual));
		} catch {
			return false;
		}
	}
}

export class AssertionEvaluationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AssertionEvaluationError";
	}
}
