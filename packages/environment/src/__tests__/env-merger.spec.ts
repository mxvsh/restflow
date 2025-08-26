import { describe, expect, it } from "vitest";
import { DefaultEnvMerger, mergeEnvironments } from "../mergers/env-merger";

describe("DefaultEnvMerger", () => {
	let merger: DefaultEnvMerger;

	beforeEach(() => {
		merger = new DefaultEnvMerger();
	});

	describe("merge", () => {
		it("should merge multiple environment objects", () => {
			const env1 = { A: "1", B: "2" };
			const env2 = { C: "3", D: "4" };
			const env3 = { E: "5" };

			const result = merger.merge(env1, env2, env3);

			expect(result).toEqual({
				A: "1",
				B: "2",
				C: "3",
				D: "4",
				E: "5",
			});
		});

		it("should handle overlapping keys with last value winning", () => {
			const env1 = { A: "1", B: "2", C: "3" };
			const env2 = { B: "override", D: "4" };
			const env3 = { C: "final", E: "5" };

			const result = merger.merge(env1, env2, env3);

			expect(result).toEqual({
				A: "1",
				B: "override",
				C: "final",
				D: "4",
				E: "5",
			});
		});

		it("should handle empty objects", () => {
			const env1 = { A: "1" };
			const env2 = {};
			const env3 = { B: "2" };

			const result = merger.merge(env1, env2, env3);

			expect(result).toEqual({
				A: "1",
				B: "2",
			});
		});

		it("should handle no arguments", () => {
			const result = merger.merge();
			expect(result).toEqual({});
		});
	});

	describe("mergeWithPrecedence", () => {
		it("should merge with overrides taking precedence", () => {
			const base = { A: "1", B: "2", C: "3" };
			const overrides = { B: "override", D: "4" };

			const result = merger.mergeWithPrecedence(base, overrides);

			expect(result).toEqual({
				A: "1",
				B: "override",
				C: "3",
				D: "4",
			});
		});

		it("should handle empty overrides", () => {
			const base = { A: "1", B: "2" };
			const overrides = {};

			const result = merger.mergeWithPrecedence(base, overrides);

			expect(result).toEqual({ A: "1", B: "2" });
		});

		it("should handle empty base", () => {
			const base = {};
			const overrides = { A: "1", B: "2" };

			const result = merger.mergeWithPrecedence(base, overrides);

			expect(result).toEqual({ A: "1", B: "2" });
		});
	});
});

describe("mergeEnvironments", () => {
	it("should merge with correct precedence", () => {
		const processEnv = { A: "process", B: "process", C: "process" };
		const fileEnv = { B: "file", C: "file", D: "file" };
		const cliOverrides = { C: "cli", E: "cli" };

		const result = mergeEnvironments(processEnv, fileEnv, cliOverrides);

		expect(result).toEqual({
			A: "process",
			B: "file",
			C: "cli", // CLI has highest precedence
			D: "file",
			E: "cli",
		});
	});

	it("should handle undefined arguments", () => {
		const result = mergeEnvironments(undefined, { A: "1" }, undefined);
		expect(result).toEqual({ A: "1" });
	});

	it("should handle all undefined arguments", () => {
		const result = mergeEnvironments();
		expect(result).toEqual({});
	});
});
