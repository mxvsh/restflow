import { describe, expect, it, vi } from "vitest";
import { DotenvLoader } from "../loaders/env-loader.js";
import { EnvironmentManager } from "./environment-manager.js";

vi.mock("../loaders/env-loader");

describe("EnvironmentManager", () => {
	it("should load an environment file", async () => {
		const dotenvLoaderMock = {
			load: vi.fn().mockReturnValue({
				API_URL: "https://jsonplaceholder.typicode.com",
			}),
			loadFromString: vi.fn(),
		};
		vi.mocked(DotenvLoader).mockImplementation(() => dotenvLoaderMock);

		const manager = new EnvironmentManager();
		const env = await manager.loadEnvironment("test.env");

		expect(env.variables.API_URL).toBe("https://jsonplaceholder.typicode.com");
	});

	it("should merge environments", () => {
		const manager = new EnvironmentManager();
		const env1 = { name: "env1", variables: { VAR1: "value1" } };
		const env2 = { name: "env2", variables: { VAR2: "value2" } };
		const merged = manager.mergeEnvironments(env1, env2);

		expect(merged.variables).toEqual({
			VAR1: "value1",
			VAR2: "value2",
		});
	});

	it("should validate an environment", () => {
		const manager = new EnvironmentManager();
		const env = {
			name: "test",
			variables: { VAR1: "value1" },
		};
		const rules = [{ key: "VAR1", required: true }];
		const result = manager.validateEnvironment(env, rules);

		expect(result.valid).toBe(true);
	});

	it("should resolve built-in variables in environment values", async () => {
		const dotenvLoaderMock = {
			load: vi.fn().mockReturnValue({
				USER: "user-{{randomString}}",
				EMAIL: "{{USER}}@example.com",
			}),
			loadFromString: vi.fn(),
		};
		vi.mocked(DotenvLoader).mockImplementation(() => dotenvLoaderMock);

		const manager = new EnvironmentManager();
		const env = await manager.loadEnvironment("test.env");

		expect(env.variables.USER).toMatch(/^user-[a-z0-9]+$/);
		expect(env.variables.EMAIL).toMatch(/^user-[a-z0-9]+@example\.com$/);
	});

	it("should resolve variable references between environment variables", async () => {
		const dotenvLoaderMock = {
			load: vi.fn().mockReturnValue({
				BASE_URL: "https://api.example.com",
				API_ENDPOINT: "{{BASE_URL}}/v1",
				FULL_PATH: "{{API_ENDPOINT}}/users",
			}),
			loadFromString: vi.fn(),
		};
		vi.mocked(DotenvLoader).mockImplementation(() => dotenvLoaderMock);

		const manager = new EnvironmentManager();
		const env = await manager.loadEnvironment("test.env");

		expect(env.variables.BASE_URL).toBe("https://api.example.com");
		expect(env.variables.API_ENDPOINT).toBe("https://api.example.com/v1");
		expect(env.variables.FULL_PATH).toBe("https://api.example.com/v1/users");
	});

	it("should handle mixed built-in and reference variables", async () => {
		const dotenvLoaderMock = {
			load: vi.fn().mockReturnValue({
				SESSION_ID: "session-{{uuid}}",
				LOG_FILE: "/logs/{{SESSION_ID}}.log",
			}),
			loadFromString: vi.fn(),
		};
		vi.mocked(DotenvLoader).mockImplementation(() => dotenvLoaderMock);

		const manager = new EnvironmentManager();
		const env = await manager.loadEnvironment("test.env");

		expect(env.variables.SESSION_ID).toMatch(/^session-[0-9a-f-]+$/);
		expect(env.variables.LOG_FILE).toMatch(/^\/logs\/session-[0-9a-f-]+\.log$/);
	});
});
