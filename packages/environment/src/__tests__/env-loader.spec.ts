import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DotenvLoader, EnvLoadError } from "../loaders/env-loader";

describe("DotenvLoader", () => {
	let loader: DotenvLoader;
	const testDir = join(process.cwd(), "test-env-files");

	beforeEach(() => {
		loader = new DotenvLoader();
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("load", () => {
		it("should load valid .env file", () => {
			const envFile = join(testDir, ".env");
			const content = `
API_URL=https://api.example.com
TOKEN=abc123
DEBUG=true
      `.trim();

			writeFileSync(envFile, content);
			const result = loader.load(envFile);

			expect(result).toEqual({
				API_URL: "https://api.example.com",
				TOKEN: "abc123",
				DEBUG: "true",
			});
		});

		it("should handle quoted values", () => {
			const envFile = join(testDir, ".env");
			const content = `
NAME="John Doe"
SINGLE='Hello World'
MIXED="It's working"
      `.trim();

			writeFileSync(envFile, content);
			const result = loader.load(envFile);

			expect(result).toEqual({
				NAME: "John Doe",
				SINGLE: "Hello World",
				MIXED: "It's working",
			});
		});

		it("should throw error for non-existent file", () => {
			const nonExistentFile = join(testDir, "non-existent.env");

			expect(() => loader.load(nonExistentFile)).toThrow(EnvLoadError);
			expect(() => loader.load(nonExistentFile)).toThrow(
				"Environment file not found",
			);
		});
	});

	describe("loadFromString", () => {
		it("should parse valid env string", () => {
			const content = `
API_URL=https://api.example.com
TOKEN=abc123
DEBUG=true
      `.trim();

			const result = loader.loadFromString(content);

			expect(result).toEqual({
				API_URL: "https://api.example.com",
				TOKEN: "abc123",
				DEBUG: "true",
			});
		});

		it("should skip comments and empty lines", () => {
			const content = `
# This is a comment
API_URL=https://api.example.com

# Another comment
TOKEN=abc123

      `;

			const result = loader.loadFromString(content);

			expect(result).toEqual({
				API_URL: "https://api.example.com",
				TOKEN: "abc123",
			});
		});

		it("should handle quoted values", () => {
			const content = `
NAME="John Doe"
DESCRIPTION='A test user'
MESSAGE="Hello 'world'"
      `;

			const result = loader.loadFromString(content);

			expect(result).toEqual({
				NAME: "John Doe",
				DESCRIPTION: "A test user",
				MESSAGE: "Hello 'world'",
			});
		});

		it("should skip invalid lines", () => {
			const content = `
VALID_KEY=value
INVALID_LINE_NO_EQUALS
ANOTHER_VALID=another_value
      `;

			const result = loader.loadFromString(content);

			expect(result).toEqual({
				VALID_KEY: "value",
				ANOTHER_VALID: "another_value",
			});
		});

		it("should handle empty string", () => {
			const result = loader.loadFromString("");
			expect(result).toEqual({});
		});

		it("should handle values with equals signs", () => {
			const content = `URL=https://example.com?param=value&other=test`;

			const result = loader.loadFromString(content);

			expect(result).toEqual({
				URL: "https://example.com?param=value&other=test",
			});
		});
	});
});
