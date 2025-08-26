import type { HttpRequest } from "@restflow/types";
import { describe, expect, it } from "vitest";
import { HttpClient, HttpError } from "../clients/http";

describe("HttpClient", () => {
	it("should create an instance with default options", () => {
		const client = new HttpClient();
		expect(client).toBeInstanceOf(HttpClient);
	});

	it("should create an instance with custom options", () => {
		const options = {
			timeout: 5000,
			retries: 3,
			followRedirects: false,
		};

		const client = new HttpClient(options);
		expect(client).toBeInstanceOf(HttpClient);
	});

	// Note: These tests would normally make real HTTP requests
	// For a complete test suite, you'd want to mock the undici request
	// or set up a test server
});

describe("HttpError", () => {
	it("should create an HttpError with all properties", () => {
		const request: HttpRequest = {
			method: "GET",
			url: "https://example.com",
		};

		const originalError = new Error("Network error");
		const httpError = new HttpError(
			"Request failed",
			request,
			1500,
			originalError,
		);

		expect(httpError).toBeInstanceOf(Error);
		expect(httpError.name).toBe("HttpError");
		expect(httpError.message).toBe("Request failed");
		expect(httpError.request).toEqual(request);
		expect(httpError.responseTime).toBe(1500);
		expect(httpError.cause).toBe(originalError);
	});

	it("should create an HttpError without cause", () => {
		const request: HttpRequest = {
			method: "POST",
			url: "https://api.example.com/users",
			headers: { "Content-Type": "application/json" },
			body: '{"name": "test"}',
		};

		const httpError = new HttpError("Timeout error", request, 30000);

		expect(httpError.name).toBe("HttpError");
		expect(httpError.message).toBe("Timeout error");
		expect(httpError.request).toEqual(request);
		expect(httpError.responseTime).toBe(30000);
		expect(httpError.cause).toBeUndefined();
	});
});
