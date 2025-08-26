/** biome-ignore-all lint/suspicious/noExplicitAny: _ */
import type { ExecutionContext, HttpRequest } from "@restflow/types";

export interface VariableResolver {
	resolve(template: string, context: ExecutionContext): string;
	resolveRequest(request: HttpRequest, context: ExecutionContext): HttpRequest;
}

export class DefaultVariableResolver implements VariableResolver {
	private static readonly VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

	resolve(template: string, context: ExecutionContext): string {
		return template.replace(
			DefaultVariableResolver.VARIABLE_PATTERN,
			(_, variableName) => {
				const value = context.variables[variableName];
				if (value === undefined) {
					throw new VariableError(`Variable '${variableName}' is not defined`);
				}
				return String(value);
			},
		);
	}

	resolveRequest(request: HttpRequest, context: ExecutionContext): HttpRequest {
		const resolvedRequest: HttpRequest = {
			method: request.method,
			url: this.resolve(request.url, context),
			timeout: request.timeout,
		};

		// Resolve headers
		if (request.headers) {
			resolvedRequest.headers = {};
			for (const [key, value] of Object.entries(request.headers)) {
				resolvedRequest.headers[this.resolve(key, context)] = this.resolve(
					value,
					context,
				);
			}
		}

		// Resolve body
		if (request.body) {
			resolvedRequest.body = this.resolve(request.body, context);
		}

		return resolvedRequest;
	}
}

export class VariableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "VariableError";
	}
}

// Utility functions
export function extractVariables(template: string): string[] {
	const variables: string[] = [];
	const pattern = /\{\{(\w+)\}\}/g;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(template)) !== null) {
		if (!variables.includes(match[1])) {
			variables.push(match[1]);
		}
	}

	return variables;
}

export function hasVariables(template: string): boolean {
	return /\{\{(\w+)\}\}/.test(template);
}

export function validateVariables(
	template: string,
	context: ExecutionContext,
): string[] {
	const missingVariables: string[] = [];
	const requiredVariables = extractVariables(template);

	for (const variable of requiredVariables) {
		if (!(variable in context.variables)) {
			missingVariables.push(variable);
		}
	}

	return missingVariables;
}

// Create a context with merged variables from multiple sources
export function createExecutionContext(
	environmentVariables: Record<string, string> = {},
	capturedVariables: Record<string, any> = {},
	cliVariables: Record<string, any> = {},
): ExecutionContext {
	return {
		variables: {
			...environmentVariables,
			...capturedVariables,
			...cliVariables, // CLI variables have highest priority
		},
		responses: [],
	};
}

// Convenience function
export function resolveTemplate(
	template: string,
	context: ExecutionContext,
): string {
	const resolver = new DefaultVariableResolver();
	return resolver.resolve(template, context);
}
