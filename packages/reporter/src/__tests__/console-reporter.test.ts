import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleReporter } from "../reporters/console-reporter.js";
import type { StepResult, FlowResult } from "@restflow/types";

describe("ConsoleReporter", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let reporter: ConsoleReporter;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		reporter = new ConsoleReporter();
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("onFlowStart", () => {
		it("should log flow start message", () => {
			reporter.onFlowStart("test-flow");
			expect(consoleSpy).toHaveBeenCalledWith("🚀 Running Flow: test-flow");
		});
	});

	describe("onStepStart", () => {
		it("should log step start with progress when showProgress is true", () => {
			reporter = new ConsoleReporter({ showProgress: true });
			reporter.onStepStart("test-step", 0, 3);
			expect(consoleSpy).toHaveBeenCalledWith("[1/3] Step: test-step");
		});

		it("should log step start without progress when showProgress is false", () => {
			reporter = new ConsoleReporter({ showProgress: false });
			reporter.onStepStart("test-step", 0, 3);
			expect(consoleSpy).toHaveBeenCalledWith("Step: test-step");
		});
	});

	describe("onStepComplete", () => {
		it("should log error when step fails", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: null,
				error: new Error("Network error"),
				directives: [],
				duration: 100
			};

			reporter.onStepComplete(stepResult);
			expect(consoleSpy).toHaveBeenCalledWith("  ❌ GET https://api.example.com - Error: Network error");
		});

		it("should log success with timing when step succeeds", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "POST", url: "https://api.example.com/users" }
				},
				response: {
					status: 201,
					headers: {},
					body: "{\"id\": 1}"
				},
				error: null,
				directives: [],
				duration: 150
			};

			reporter = new ConsoleReporter({ showTimings: true });
			reporter.onStepComplete(stepResult);
			expect(consoleSpy).toHaveBeenCalledWith("  ✅ POST https://api.example.com/users - 201 (150ms)");
		});

		it("should log directives results", () => {
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
					{
						directive: { type: "assert", expression: "status == 200" },
						success: true,
						error: null
					},
					{
						directive: { type: "capture", variable: "userId", expression: "$.id" },
						success: false,
						error: "Path not found"
					}
				],
				duration: 100
			};

			reporter.onStepComplete(stepResult);
			expect(consoleSpy).toHaveBeenCalledWith("    ✓ assert: status == 200");
			expect(consoleSpy).toHaveBeenCalledWith("    ✗ capture: userId → $.id");
		});

		it("should show headers when showHeaders option is enabled", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: {
					status: 200,
					headers: {
						"content-type": "application/json",
						"x-custom": "value"
					},
					body: "{}"
				},
				error: null,
				directives: [],
				duration: 100
			};

			reporter = new ConsoleReporter({ showHeaders: true });
			reporter.onStepComplete(stepResult);
			
			expect(consoleSpy).toHaveBeenCalledWith("    Headers:");
			expect(consoleSpy).toHaveBeenCalledWith("      content-type: application/json");
			expect(consoleSpy).toHaveBeenCalledWith("      x-custom: value");
		});

		it("should show response body when showBody option is enabled", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: {
					status: 200,
					headers: {},
					body: JSON.stringify({ message: "Hello World" })
				},
				error: null,
				directives: [],
				duration: 100
			};

			reporter = new ConsoleReporter({ showBody: true });
			reporter.onStepComplete(stepResult);
			
			expect(consoleSpy).toHaveBeenCalledWith("    Response Body:");
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("\"message\": \"Hello World\""));
		});
	});

	describe("onFlowComplete", () => {
		it("should log passed summary", () => {
			const flowResult: FlowResult = {
				success: true,
				duration: 500,
				steps: [
					{
						step: { name: "step1", request: { method: "GET", url: "test" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null }
						],
						duration: 100
					},
					{
						step: { name: "step2", request: { method: "POST", url: "test" } },
						response: { status: 201, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null },
							{ directive: { type: "capture" }, success: true, error: null }
						],
						duration: 200
					}
				]
			};

			reporter = new ConsoleReporter({ showTimings: true });
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("\nSummary: ✅ PASSED");
			expect(consoleSpy).toHaveBeenCalledWith("Steps: 2/2 passed");
			expect(consoleSpy).toHaveBeenCalledWith("Directives: 3/3 passed");
			expect(consoleSpy).toHaveBeenCalledWith("Duration: 500ms");
		});

		it("should log failed summary", () => {
			const flowResult: FlowResult = {
				success: false,
				duration: 300,
				steps: [
					{
						step: { name: "step1", request: { method: "GET", url: "test" } },
						response: { status: 200, headers: {}, body: "" },
						error: null,
						directives: [
							{ directive: { type: "assert" }, success: true, error: null }
						],
						duration: 100
					},
					{
						step: { name: "step2", request: { method: "POST", url: "test" } },
						response: null,
						error: new Error("Request failed"),
						directives: [],
						duration: 50
					}
				]
			};

			reporter = new ConsoleReporter({ showTimings: false });
			reporter.onFlowComplete(flowResult);

			expect(consoleSpy).toHaveBeenCalledWith("\nSummary: ❌ FAILED");
			expect(consoleSpy).toHaveBeenCalledWith("Steps: 1/2 passed");
			expect(consoleSpy).toHaveBeenCalledWith("Directives: 1/1 passed");
			expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Duration"));
		});
	});
});