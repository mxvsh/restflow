import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SummaryReporter } from "../reporters/summary-reporter.js";
import type { StepResult, FlowResult } from "@restflow/types";

describe("SummaryReporter", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let reporter: SummaryReporter;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		reporter = new SummaryReporter();
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("onFlowStart", () => {
		it("should be silent in non-verbose mode", () => {
			reporter.onFlowStart("test-flow");
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should log flow start in verbose mode", () => {
			reporter = new SummaryReporter({ verbose: true });
			reporter.onFlowStart("test-flow");
			expect(consoleSpy).toHaveBeenCalledWith("Starting test-flow...");
		});
	});

	describe("onStepStart", () => {
		it("should be silent in non-verbose mode", () => {
			reporter.onStepStart("test-step", 0, 3);
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should log step progress in verbose mode", () => {
			reporter = new SummaryReporter({ verbose: true });
			reporter.onStepStart("test-step", 1, 3);
			expect(consoleSpy).toHaveBeenCalledWith("[2/3] test-step");
		});
	});

	describe("onStepComplete", () => {
		it("should be silent in non-verbose mode for successful steps", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: {
					status: 200,
					headers: {},
					body: "{\"success\": true}"
				},
				error: null,
				directives: [
					{ directive: { type: "assert" }, success: true, error: null }
				],
				duration: 100
			};

			reporter.onStepComplete(stepResult);
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should log errors in verbose mode", () => {
			const stepResult: StepResult = {
				step: {
					name: "failed-step",
					request: { method: "GET", url: "https://api.example.com/error" }
				},
				response: null,
				error: new Error("Connection failed"),
				directives: [],
				duration: 100
			};

			reporter = new SummaryReporter({ verbose: true });
			reporter.onStepComplete(stepResult);
			expect(consoleSpy).toHaveBeenCalledWith("  ❌ failed-step: Connection failed");
		});
	});

	describe("onFlowComplete", () => {
		it("should output concise summary for successful flow", () => {
			const flowResult: FlowResult = {
				success: true,
				duration: 500,
				steps: [
					{
						step: { name: "step1", request: { method: "GET", url: "test1" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null },
							{ directive: { type: "capture" }, success: true, error: null }
						],
						duration: 200
					},
					{
						step: { name: "step2", request: { method: "POST", url: "test2" } },
						response: { status: 201, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null }
						],
						duration: 300
					}
				]
			};

			// Mock Date.now to control timing
			const mockStart = 1000;
			const mockEnd = 1500;
			vi.spyOn(Date, "now")
				.mockReturnValueOnce(mockStart) // onFlowStart
				.mockReturnValueOnce(mockEnd);  // onFlowComplete

			reporter.onFlowStart("test-flow");
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("PASS | 2/2 steps | 3/3 assertions | 500ms");
		});

		it("should output failed summary with failure details", () => {
			const flowResult: FlowResult = {
				success: false,
				duration: 300,
				steps: [
					{
						step: { name: "success-step", request: { method: "GET", url: "test1" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null }
						],
						duration: 100
					},
					{
						step: { name: "failed-step", request: { method: "POST", url: "test2" } },
						response: null,
						error: new Error("Network timeout"),
						directives: [],
						duration: 200
					},
					{
						step: { name: "assertion-fail", request: { method: "GET", url: "test3" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert", expression: "status == 201" }, success: false, error: "Expected 201, got 200" },
							{ directive: { type: "capture" }, success: true, error: null }
						],
						duration: 50
					}
				]
			};

			const mockStart = 1000;
			const mockEnd = 1300;
			vi.spyOn(Date, "now")
				.mockReturnValueOnce(mockStart)
				.mockReturnValueOnce(mockEnd);

			reporter.onFlowStart("failed-flow");
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("FAIL | 2/3 steps | 2/3 assertions | 300ms");
			expect(consoleSpy).toHaveBeenCalledWith("\nFailed steps:");
			expect(consoleSpy).toHaveBeenCalledWith("  - failed-step: Network timeout");
			expect(consoleSpy).toHaveBeenCalledWith("\nFailed assertions:");
			expect(consoleSpy).toHaveBeenCalledWith("  - assertion-fail: assert failed");
		});

		it("should handle flow with no failed steps but failed assertions", () => {
			const flowResult: FlowResult = {
				success: false,
				duration: 200,
				steps: [
					{
						step: { name: "test-step", request: { method: "GET", url: "test" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null },
							{ directive: { type: "assert" }, success: false, error: "Assertion failed" }
						],
						duration: 200
					}
				]
			};

			const mockStart = 1000;
			const mockEnd = 1200;
			vi.spyOn(Date, "now")
				.mockReturnValueOnce(mockStart)
				.mockReturnValueOnce(mockEnd);

			reporter.onFlowStart("assertion-fail-flow");
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("FAIL | 1/1 steps | 1/2 assertions | 200ms");
			expect(consoleSpy).not.toHaveBeenCalledWith("\nFailed steps:");
			expect(consoleSpy).toHaveBeenCalledWith("\nFailed assertions:");
			expect(consoleSpy).toHaveBeenCalledWith("  - test-step: assert failed");
		});

		it("should handle empty flow", () => {
			const flowResult: FlowResult = {
				success: true,
				duration: 0,
				steps: []
			};

			const mockStart = 1000;
			const mockEnd = 1000;
			vi.spyOn(Date, "now")
				.mockReturnValueOnce(mockStart)
				.mockReturnValueOnce(mockEnd);

			reporter.onFlowStart("empty-flow");
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("PASS | 0/0 steps | 0/0 assertions | 0ms");
		});
	});

	describe("timing calculation", () => {
		it("should calculate duration correctly", () => {
			const flowResult: FlowResult = {
				success: true,
				duration: 1500,
				steps: []
			};

			const mockStart = 1000;
			const mockEnd = 2500; // 1500ms difference
			vi.spyOn(Date, "now")
				.mockReturnValueOnce(mockStart)
				.mockReturnValueOnce(mockEnd);

			reporter.onFlowStart("timing-test");
			reporter.onFlowComplete(flowResult);

			// Should use actual measured time (1500ms) not the flow result duration
			expect(consoleSpy).toHaveBeenCalledWith("PASS | 0/0 steps | 0/0 assertions | 1500ms");
		});
	});
});