export interface ParsedAssertion {
	left: string;
	operator: ComparisonOperator;
	right: unknown;
}

export type ComparisonOperator =
	| "=="
	| "!="
	| ">"
	| ">="
	| "<"
	| "<="
	| "contains"
	| "not_contains"
	| "matches"
	| "not_matches"
	| "exists"
	| "not_exists";

export class ExpressionParser {
	private static readonly OPERATORS = [
		"not_contains",
		"not_matches",
		"not_exists", // Check longer operators first
		">=",
		"<=",
		"!=",
		"==",
		">",
		"<",
		"contains",
		"matches",
		"exists",
	];

	parse(expression: string): ParsedAssertion {
		const trimmed = expression.trim();

		// Find the operator
		for (const op of ExpressionParser.OPERATORS) {
			const index = trimmed.indexOf(op);
			if (index > 0) {
				const left = trimmed.substring(0, index).trim();
				const right = trimmed.substring(index + op.length).trim();

				return {
					left,
					operator: op as ComparisonOperator,
					right: this.parseValue(right),
				};
			}
		}

		throw new ExpressionParseError(
			`Invalid assertion expression: ${expression}`,
		);
	}

	private parseValue(value: string): unknown {
		const trimmed = value.trim();

		// Handle quoted strings
		if (
			(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			(trimmed.startsWith("'") && trimmed.endsWith("'"))
		) {
			return trimmed.slice(1, -1);
		}

		// Handle booleans
		if (trimmed === "true") return true;
		if (trimmed === "false") return false;

		// Handle null
		if (trimmed === "null") return null;

		// Handle numbers
		if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
			return Number(trimmed);
		}

		// Return as string for everything else
		return trimmed;
	}
}

export class ExpressionParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ExpressionParseError";
	}
}
