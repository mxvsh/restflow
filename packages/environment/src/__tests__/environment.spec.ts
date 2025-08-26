import { describe, expect, it } from "vitest";

// Import tests from modular files
import "./env-loader.spec";
import "./env-merger.spec";
import "./environment-manager.spec";

describe("environment package", () => {
	it("should export all modules correctly", async () => {
		const {
			DotenvLoader,
			DefaultEnvMerger,
			EnvironmentManager,
			EnvValidator,
			loadEnvironmentFile,
		} = await import("../index.js");

		expect(DotenvLoader).toBeDefined();
		expect(DefaultEnvMerger).toBeDefined();
		expect(EnvironmentManager).toBeDefined();
		expect(EnvValidator).toBeDefined();
		expect(loadEnvironmentFile).toBeDefined();
	});
});
