import type { HttpResponse } from "@restflow/types";
import { describe, expect, it } from "vitest";
import { DefaultValueExtractor } from "../extractors/value-extractor";

describe("DefaultValueExtractor", () => {
	const extractor = new DefaultValueExtractor();

	const sampleResponse: HttpResponse = {
		status: 200,
		statusText: "OK",
		headers: {
			"content-type": "application/json",
			"x-custom-header": "custom-value",
		},
		body: JSON.stringify({
			message: "Hello World",
			data: {
				id: 123,
				name: "John Doe",
				tags: ["user", "active"],
			},
			items: [
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			],
		}),
		responseTime: 150,
	};

	describe("extract", () => {
		it("should extract status", () => {
			const result = extractor.extract("status", sampleResponse);
			expect(result).toBe(200);
		});

		it("should extract statusText", () => {
			const result = extractor.extract("statusText", sampleResponse);
			expect(result).toBe("OK");
		});

		it("should extract responseTime", () => {
			const result = extractor.extract("responseTime", sampleResponse);
			expect(result).toBe(150);
		});

		it("should extract headers", () => {
			const result = extractor.extract("headers.content-type", sampleResponse);
			expect(result).toBe("application/json");
		});

		it("should extract custom headers", () => {
			const result = extractor.extract(
				"headers.x-custom-header",
				sampleResponse,
			);
			expect(result).toBe("custom-value");
		});

		it("should return undefined for non-existent header", () => {
			const result = extractor.extract("headers.non-existent", sampleResponse);
			expect(result).toBeUndefined();
		});

		it("should extract full body", () => {
			const result = extractor.extract("body", sampleResponse);
			expect(result).toEqual({
				message: "Hello World",
				data: {
					id: 123,
					name: "John Doe",
					tags: ["user", "active"],
				},
				items: [
					{ id: 1, name: "Item 1" },
					{ id: 2, name: "Item 2" },
				],
			});
		});

		it("should extract simple body property", () => {
			const result = extractor.extract("body.message", sampleResponse);
			expect(result).toBe("Hello World");
		});

		it("should extract nested body property", () => {
			const result = extractor.extract("body.data.id", sampleResponse);
			expect(result).toBe(123);
		});

		it("should extract array elements", () => {
			const result = extractor.extract("body.data.tags[0]", sampleResponse);
			expect(result).toBe("user");
		});

		it("should extract from array of objects", () => {
			const result = extractor.extract("body.items[1].name", sampleResponse);
			expect(result).toBe("Item 2");
		});

		it("should handle JSONPath queries", () => {
			const result = extractor.extract("body.items[*].id", sampleResponse);
			expect(result).toEqual([1, 2]);
		});

		it("should handle body length for string response", () => {
			const stringResponse: HttpResponse = {
				...sampleResponse,
				body: "Hello World",
			};
			const result = extractor.extract("body.length", stringResponse);
			expect(result).toBe(11);
		});

		it("should handle non-JSON body", () => {
			const textResponse: HttpResponse = {
				...sampleResponse,
				body: "Plain text response",
			};
			const result = extractor.extract("body", textResponse);
			expect(result).toBe("Plain text response");
		});

		it("should handle empty body", () => {
			const emptyResponse: HttpResponse = {
				...sampleResponse,
				body: "",
			};
			const result = extractor.extract("body", emptyResponse);
			expect(result).toBe("");
		});

		it("should handle malformed JSON gracefully", () => {
			const malformedResponse: HttpResponse = {
				...sampleResponse,
				body: '{"invalid": json}',
			};
			const result = extractor.extract("body", malformedResponse);
			expect(result).toBe('{"invalid": json}');
		});

		it("should extract using JSONPath on entire response", () => {
			const result = extractor.extract("status", sampleResponse);
			expect(result).toBe(200);
		});

		it("should return undefined for non-existent nested property", () => {
			const result = extractor.extract("body.data.nonexistent", sampleResponse);
			expect(result).toBeUndefined();
		});

		it("should handle case-insensitive headers", () => {
			const result = extractor.extract("headers.Content-Type", sampleResponse);
			expect(result).toBe("application/json");
		});
	});
});
