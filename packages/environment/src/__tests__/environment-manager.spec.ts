import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ValidationRule } from "../validators/env-validator";
import { EnvironmentManager, loadEnvironmentFile } from "../managers/environment-manager";

describe("EnvironmentManager", () => {
	let manager: EnvironmentManager;
	const testDir = join(process.cwd(), "test-env-manager");

	beforeEach(() => {
		manager = new EnvironmentManager();
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("loadEnvironment", () => {
		it("should load environment from file", async () => {
			const envFile = join(testDir, "test.env");
			const content = `
API_URL=https://api.example.com
TOKEN=abc123
      `.trim();

			writeFileSync(envFile, content);
			const environment = await manager.loadEnvironment(envFile);

			expect(environment.name).toBe("test");
			expect(environment.variables).toEqual({
				API_URL: "https://api.example.com",
				TOKEN: "abc123",
			});
		});

		it("should return default environment when no file provided", async () => {
			const environment = await manager.loadEnvironment();

			expect(environment.name).toBe("default");
			expect(environment.variables).toEqual({});
		});

		it("should include process env when configured", async () => {
			const originalEnv = process.env.TEST_VAR;
			process.env.TEST_VAR = "test_value";

			const managerWithProcessEnv = new EnvironmentManager({
				includeProcessEnv: true,
			});

			const environment = await managerWithProcessEnv.loadEnvironment();

			expect(environment.variables.TEST_VAR).toBe("test_value");

			// Cleanup
			if (originalEnv !== undefined) {
				process.env.TEST_VAR = originalEnv;
			} else {
				delete process.env.TEST_VAR;
			}
		});
	});

	describe("validateEnvironment", () => {
		it("should validate environment against rules", () => {
			const environment = {
				name: "test",
				variables: {
					API_URL: "https://api.example.com",
					PORT: "3000",
					DEBUG: "true",
				},
			};

			const rules: ValidationRule[] = [
				{ key: "API_URL", required: true, pattern: /^https?:\/\/.+/ },
				{ key: "PORT", type: "number" },
				{ key: "DEBUG", type: "boolean" },
			];

			const result = manager.validateEnvironment(environment, rules);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should return errors for invalid environment", () => {
			const environment = {
				name: "test",
				variables: {
					PORT: "invalid_number",
				},
			};

			const rules: ValidationRule[] = [
				{ key: "API_URL", required: true },
				{ key: "PORT", type: "number" },
			];

			const result = manager.validateEnvironment(environment, rules);

			expect(result.valid).toBe(false);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].key).toBe("API_URL");
			expect(result.errors[1].key).toBe("PORT");
		});
	});

	describe("mergeEnvironments", () => {
		it("should merge multiple environments", () => {
			const env1 = { name: "env1", variables: { A: "1", B: "2" } };
			const env2 = { name: "env2", variables: { B: "override", C: "3" } };

			const merged = manager.mergeEnvironments(env1, env2);

			expect(merged.name).toBe("merged");
			expect(merged.variables).toEqual({
				A: "1",
				B: "override",
				C: "3",
			});
		});

		it("should handle empty environments", () => {
			const env1 = { name: "env1", variables: {} };
			const env2 = { name: "env2", variables: { A: "1" } };

			const merged = manager.mergeEnvironments(env1, env2);

			expect(merged.variables).toEqual({ A: "1" });
		});
	});
});

describe("loadEnvironmentFile", () => {
	const testDir = join(process.cwd(), "test-load-env");

	beforeEach(() => {
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("should load environment file using convenience function", async () => {
		const envFile = join(testDir, "app.env");
		const content = `
APP_NAME=TestApp
VERSION=1.0.0
    `.trim();

		writeFileSync(envFile, content);
		const environment = await loadEnvironmentFile(envFile);

		expect(environment.name).toBe("app");
		expect(environment.variables).toEqual({
			APP_NAME: "TestApp",
			VERSION: "1.0.0",
		});
	});
});
