import type { HttpResponse } from "@restflow/types";
import jsonpath from "jsonpath";

export interface ValueExtractor {
	extract(path: string, response: HttpResponse): unknown;
}

export class DefaultValueExtractor implements ValueExtractor {
	extract(path: string, response: HttpResponse): unknown {
		// Handle special built-in properties
		if (path === "status") {
			return response.status;
		}

		if (path === "statusText") {
			return response.statusText;
		}

		if (path === "responseTime") {
			return response.responseTime;
		}

		// Handle headers
		if (path.startsWith("headers.")) {
			const headerName = path.substring("headers.".length);
			return (
				response.headers[headerName] ||
				response.headers[headerName.toLowerCase()]
			);
		}

		// Handle body paths
		if (path.startsWith("body")) {
			return this.extractFromBody(path, response.body);
		}

		// For any other path, treat as JSONPath on the entire response
		try {
			const responseObject = {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				body: this.parseBodyIfJson(response.body),
				responseTime: response.responseTime,
			};

			const results = jsonpath.query(responseObject, `$.${path}`);
			return results.length === 1
				? results[0]
				: results.length === 0
					? undefined
					: results;
		} catch (error) {
			throw new ValueExtractionError(
				`Failed to extract value from path '${path}': ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	private extractFromBody(path: string, body: string): unknown {
		if (path === "body") {
			return this.parseBodyIfJson(body);
		}

		// Extract using JSONPath on parsed body
		const parsedBody = this.parseBodyIfJson(body);

		if (path === "body.length" && typeof parsedBody === "string") {
			return parsedBody.length;
		}

		if (path.startsWith("body.")) {
			const bodyPath = path.substring("body.".length);

			if (typeof parsedBody === "object" && parsedBody !== null) {
				try {
					// Convert dot notation with arrays to proper JSONPath
					const jsonPath = this.convertToJsonPath(bodyPath);
					const results = jsonpath.query(parsedBody, jsonPath);
					return results.length === 1
						? results[0]
						: results.length === 0
							? undefined
							: results;
				} catch {
					// Fallback to simple property access
					return this.getNestedProperty(parsedBody, bodyPath);
				}
			}
		}

		return parsedBody;
	}

	private parseBodyIfJson(body: string): unknown {
		if (!body || typeof body !== "string") {
			return body;
		}

		const trimmed = body.trim();
		if (
			(trimmed.startsWith("{") && trimmed.endsWith("}")) ||
			(trimmed.startsWith("[") && trimmed.endsWith("]"))
		) {
			try {
				return JSON.parse(body);
			} catch {
				return body; // Return as string if JSON parsing fails
			}
		}

		return body;
	}

	private convertToJsonPath(path: string): string {
		// Convert notation like 'data.tags[0]' to '$.data.tags[0]'
		// Convert notation like 'items[*].id' to '$.items[*].id'
		return `$.${path}`;
	}

	private getNestedProperty(obj: unknown, path: string): unknown {
		return path.split(".").reduce((current: unknown, key: string) => {
			return (current as Record<string, unknown>)?.[key];
		}, obj);
	}
}

export class ValueExtractionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValueExtractionError";
	}
}
