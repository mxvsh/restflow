import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSONReporter } from "../reporters/json-reporter.js";
import type { StepResult, FlowResult } from "@restflow/types";

describe("JSONReporter", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let reporter: JSONReporter;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		reporter = new JSONReporter();
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("verbose mode", () => {
		beforeEach(() => {
			reporter = new JSONReporter({ verbose: true });
		});

		it("should output flow start event in verbose mode", () => {
			reporter.onFlowStart("test-flow");
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"event":"flow_started"')
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"flowName":"test-flow"')
			);
		});

		it("should output step start event in verbose mode", () => {
			reporter.onStepStart("test-step", 0, 2);
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"event":"step_started"')
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"stepName":"test-step"')
			);
		});

		it("should output step completion event in verbose mode", () => {
			const stepResult: StepResult = {
				step: {
					name: "test-step",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: {
					status: 200,
					headers: {},
					body: "{\"id\": 1}"
				},
				error: null,
				directives: [
					{ directive: { type: "assert" }, success: true, error: null }
				],
				duration: 150
			};

			reporter.onFlowStart("test-flow");
			reporter.onStepComplete(stepResult);
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"event":"step_completed"')
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"name":"test-step"')
			);
		});

		it("should output flow completion event in verbose mode", () => {
			const flowResult: FlowResult = {
				success: true,
				duration: 500,
				steps: []
			};

			reporter.onFlowStart("test-flow");
			reporter.onFlowComplete(flowResult);
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('"event":"flow_completed"')
			);
		});
	});

	describe("non-verbose mode", () => {
		it("should not output intermediate events", () => {
			reporter.onFlowStart("test-flow");
			reporter.onStepStart("test-step", 0, 1);
			
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should output complete results only at the end", () => {
			const stepResult: StepResult = {
				step: {
					name: "api-test",
					request: { method: "POST", url: "https://api.example.com/users" }
				},
				response: {
					status: 201,
					headers: { "content-type": "application/json" },
					body: "{\"id\": 123, \"name\": \"Test User\"}"
				},
				error: null,
				directives: [
					{
						directive: { type: "assert", expression: "status == 201" },
						success: true,
						error: null
					},
					{
						directive: { type: "capture", variable: "userId", expression: "$.id" },
						success: true,
						error: null
					}
				],
				duration: 250
			};

			const flowResult: FlowResult = {
				success: true,
				duration: 300,
				steps: [stepResult]
			};

			reporter.onFlowStart("test-flow");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			// Should only be called once for the final output
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			
			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed).toMatchObject({
				flowName: "test-flow",
				success: true,
				duration: 300,
				steps: [
					{
						name: "api-test",
						method: "POST",
						url: "https://api.example.com/users",
						status: 201,
						duration: 250,
						success: true,
						directives: [
							{ type: "assert", success: true, error: null },
							{ type: "capture", success: true, error: null }
						]
					}
				],
				summary: {
					steps: { total: 1, passed: 1, failed: 0 },
					directives: { total: 2, passed: 2, failed: 0 }
				}
			});

			expect(parsed.startTime).toBeTypeOf("number");
			expect(parsed.endTime).toBeTypeOf("number");
		});
	});

	describe("step data collection", () => {
		it("should collect step data with error", () => {
			const stepResult: StepResult = {
				step: {
					name: "failed-step",
					request: { method: "GET", url: "https://api.example.com/error" }
				},
				response: null,
				error: new Error("Connection timeout"),
				directives: [],
				duration: 5000
			};

			const flowResult: FlowResult = {
				success: false,
				duration: 5000,
				steps: [stepResult]
			};

			reporter.onFlowStart("error-flow");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed.steps[0]).toMatchObject({
				name: "failed-step",
				method: "GET",
				url: "https://api.example.com/error",
				duration: 5000,
				success: false,
				error: "Connection timeout",
				directives: []
			});
		});

		it("should include optional request/response body when showBody is enabled", () => {
			const stepResult: StepResult = {
				step: {
					name: "body-test",
					request: { 
						method: "POST", 
						url: "https://api.example.com/data",
						body: JSON.stringify({ test: "data" })
					}
				},
				response: {
					status: 200,
					headers: {},
					body: JSON.stringify({ result: "success" })
				},
				error: null,
				directives: [],
				duration: 100
			};

			const flowResult: FlowResult = {
				success: true,
				duration: 100,
				steps: [stepResult]
			};

			reporter = new JSONReporter({ showBody: true });
			reporter.onFlowStart("body-flow");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed.steps[0]).toHaveProperty("requestBody", { test: "data" });
			expect(parsed.steps[0]).toHaveProperty("responseBody", { result: "success" });
		});

		it("should include headers when showHeaders is enabled", () => {
			const stepResult: StepResult = {
				step: {
					name: "header-test",
					request: { method: "GET", url: "https://api.example.com" }
				},
				response: {
					status: 200,
					headers: {
						"content-type": "application/json",
						"x-request-id": "abc-123"
					},
					body: "{}"
				},
				error: null,
				directives: [],
				duration: 100
			};

			const flowResult: FlowResult = {
				success: true,
				duration: 100,
				steps: [stepResult]
			};

			reporter = new JSONReporter({ showHeaders: true });
			reporter.onFlowStart("header-flow");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed.steps[0]).toHaveProperty("headers", {
				"content-type": "application/json",
				"x-request-id": "abc-123"
			});
		});
	});

	describe("parseBodySafely", () => {
		it("should parse valid JSON", () => {
			const stepResult: StepResult = {
				step: {
					name: "json-test",
					request: { method: "GET", url: "test" }
				},
				response: {
					status: 200,
					headers: {},
					body: '{"valid": "json"}'
				},
				error: null,
				directives: [],
				duration: 100
			};

			const flowResult: FlowResult = {
				success: true,
				duration: 100,
				steps: [stepResult]
			};

			reporter = new JSONReporter({ showBody: true });
			reporter.onFlowStart("test");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed.steps[0].responseBody).toEqual({ valid: "json" });
		});

		it("should return string for invalid JSON", () => {
			const stepResult: StepResult = {
				step: {
					name: "text-test",
					request: { method: "GET", url: "test" }
				},
				response: {
					status: 200,
					headers: {},
					body: "plain text response"
				},
				error: null,
				directives: [],
				duration: 100
			};

			const flowResult: FlowResult = {
				success: true,
				duration: 100,
				steps: [stepResult]
			};

			reporter = new JSONReporter({ showBody: true });
			reporter.onFlowStart("test");
			reporter.onStepComplete(stepResult);
			reporter.onFlowComplete(flowResult);

			const output = consoleSpy.mock.calls[0][0];
			const parsed = JSON.parse(output);

			expect(parsed.steps[0].responseBody).toBe("plain text response");
		});
	});
});