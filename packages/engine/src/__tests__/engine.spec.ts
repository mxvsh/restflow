import type { DefaultAssertionEvaluator } from "@restflow/assertions";
import type { EnvironmentManager } from "@restflow/environment";
import type { HttpClient } from "@restflow/http";
import type { HttpResponse, RestflowConfig } from "@restflow/types";
import type { DefaultVariableResolver } from "@restflow/variables";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeFlowFromString, FlowExecutor } from "../core/engine.js";

describe("FlowExecutor", () => {
	let executor: FlowExecutor;
	let mockHttpClient: HttpClient;
	let mockVariableResolver: DefaultVariableResolver;
	let mockEnvironmentManager: EnvironmentManager;
	let mockAssertionEvaluator: DefaultAssertionEvaluator;

	const mockResponse: HttpResponse = {
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json" },
		body: '{"id": 123, "name": "test"}',
		responseTime: 100,
	};

	beforeEach(() => {
		mockHttpClient = {
			execute: vi.fn().mockImplementation(async () => {
				// Add small delay to simulate real HTTP request
				await new Promise((resolve) => setTimeout(resolve, 1));
				return mockResponse;
			}),
		} as any;

		mockVariableResolver = {
			resolveRequest: vi.fn((req) => req),
		} as any;

		mockEnvironmentManager = {
			loadEnvironment: vi.fn().mockResolvedValue({
				name: "test",
				variables: { baseUrl: "http://localhost:3000" },
			}),
		} as any;

		mockAssertionEvaluator = {
			evaluate: vi.fn().mockReturnValue({
				expression: "status == 200",
				passed: true,
				actual: 200,
				expected: 200,
				operator: "==",
			}),
		} as any;

		executor = new FlowExecutor({
			httpClient: mockHttpClient,
			variableResolver: mockVariableResolver,
			environmentManager: mockEnvironmentManager,
			assertionEvaluator: mockAssertionEvaluator,
		});
	});

	describe("constructor", () => {
		it("should create executor with default options", () => {
			const defaultExecutor = new FlowExecutor();
			expect(defaultExecutor).toBeDefined();
		});

		it("should create executor with custom config", () => {
			const config: RestflowConfig = {
				timeout: 5000,
				retries: 3,
				baseUrl: "https://api.example.com",
			};

			const customExecutor = new FlowExecutor({ config });
			expect(customExecutor).toBeDefined();
		});
	});

	describe("executeFlow", () => {
		it("should parse and execute a simple flow", async () => {
			const flowContent = `### Test Step
GET http://localhost:3000/api/test
> assert status == 200`;

			const result = await executor.executeFlow(flowContent);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].response).toEqual(mockResponse);
			expect(mockHttpClient.execute).toHaveBeenCalledOnce();
		});

		it("should handle parsing errors", async () => {
			const invalidFlowContent = "invalid flow content";

			const result = await executor.executeFlow(invalidFlowContent);

			expect(result.success).toBe(false);
			expect(result.steps).toHaveLength(0);
		});

		it("should load environment variables when environmentPath is provided", async () => {
			const flowContent = `### Test Step
GET {{baseUrl}}/api/test`;

			await executor.executeFlow(flowContent, ".env");

			expect(mockEnvironmentManager.loadEnvironment).toHaveBeenCalledWith(
				".env",
			);
		});
	});

	describe("executeFlowObject", () => {
		it("should execute a flow object successfully", async () => {
			const flow = {
				steps: [
					{
						name: "Test Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [
							{
								type: "assert" as const,
								expression: "status == 200",
							},
						],
					},
				],
			};

			const result = await executor.executeFlowObject(flow);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(1);
			expect(result.flow).toEqual(flow);
			expect(result.duration).toBeGreaterThan(0);
		});

		it("should handle HTTP request failures", async () => {
			const httpError = new Error("Network error");
			vi.mocked(mockHttpClient.execute).mockRejectedValueOnce(httpError);

			const flow = {
				steps: [
					{
						name: "Failing Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [],
					},
				],
			};

			const result = await executor.executeFlowObject(flow);

			expect(result.success).toBe(false);
			expect(result.steps[0].error).toBeDefined();
			expect(result.steps[0].error?.message).toBe("Network error");
		});

		it("should process capture directives", async () => {
			const flow = {
				steps: [
					{
						name: "Capture Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [
							{
								type: "capture" as const,
								variable: "userId",
								expression: "body.id",
							},
						],
					},
					{
						name: "Use Captured Variable",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/user/{{userId}}",
						},
						directives: [],
					},
				],
			};

			// Mock value extractor to return captured value
			const mockValueExtractor = {
				extract: vi.fn().mockReturnValue(123),
			};

			// Create executor with mock value extractor
			const executorWithMockExtractor = new FlowExecutor({
				httpClient: mockHttpClient,
				variableResolver: mockVariableResolver,
				environmentManager: mockEnvironmentManager,
				assertionEvaluator: mockAssertionEvaluator,
			});

			// Replace the private valueExtractor for testing
			(executorWithMockExtractor as any).valueExtractor = mockValueExtractor;

			const result = await executorWithMockExtractor.executeFlowObject(flow);

			expect(result.success).toBe(true);
			expect(result.context.variables.userId).toBe(123);
			expect(mockVariableResolver.resolveRequest).toHaveBeenCalledTimes(2);
		});

		it("should handle assertion failures", async () => {
			vi.mocked(mockAssertionEvaluator.evaluate).mockReturnValue({
				expression: "status == 201",
				passed: false,
				actual: 200,
				expected: 201,
				operator: "==",
			});

			const flow = {
				steps: [
					{
						name: "Assertion Failure Step",
						request: {
							method: "POST" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [
							{
								type: "assert" as const,
								expression: "status == 201",
							},
						],
					},
				],
			};

			const result = await executor.executeFlowObject(flow);

			expect(result.success).toBe(false);
			expect(result.steps[0].directives[0].success).toBe(false);
			expect(result.steps[0].directives[0].error).toContain("Assertion failed");
		});
	});

	describe("error handling", () => {
		it("should handle environment loading failures gracefully", async () => {
			vi.mocked(mockEnvironmentManager.loadEnvironment).mockRejectedValue(
				new Error("Environment file not found"),
			);

			const flow = {
				steps: [
					{
						name: "Test Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [],
					},
				],
			};

			// Should not throw, but continue with empty environment
			const result = await executor.executeFlowObject(flow, ".env");

			expect(result.success).toBe(true);
			expect(result.context.variables).toEqual({});
		});

		it("should handle variable resolution errors", async () => {
			vi.mocked(mockVariableResolver.resolveRequest).mockImplementation(() => {
				throw new Error("Variable not found");
			});

			const flow = {
				steps: [
					{
						name: "Variable Error Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/{{missingVar}}",
						},
						directives: [],
					},
				],
			};

			const result = await executor.executeFlowObject(flow);

			expect(result.success).toBe(false);
			expect(result.steps[0].error).toBeDefined();
		});
	});

	describe("timing and metrics", () => {
		it("should track execution duration", async () => {
			const flow = {
				steps: [
					{
						name: "Timed Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [],
					},
				],
			};

			const result = await executor.executeFlowObject(flow);

			expect(result.duration).toBeGreaterThan(0);
			expect(result.steps[0].duration).toBeGreaterThan(0);
		});

		it("should track response times", async () => {
			const result = await executor.executeFlowObject({
				steps: [
					{
						name: "Response Time Step",
						request: {
							method: "GET" as const,
							url: "http://localhost:3000/api/test",
						},
						directives: [],
					},
				],
			});

			expect(result.steps[0].response?.responseTime).toBe(100);
		});
	});
});

describe("convenience functions", () => {
	let mockHttpClient: HttpClient;

	beforeEach(() => {
		mockHttpClient = {
			execute: vi.fn().mockImplementation(async () => {
				// Add small delay to simulate real HTTP request
				await new Promise((resolve) => setTimeout(resolve, 1));
				return {
					status: 200,
					statusText: "OK",
					headers: {},
					body: "OK",
					responseTime: 50,
				};
			}),
		} as any;
	});

	describe("executeFlowFromString", () => {
		it("should execute flow from string content", async () => {
			const flowContent = `### Simple Step
GET http://localhost:3000/api/test`;

			const result = await executeFlowFromString(flowContent, {
				httpClient: mockHttpClient,
			});

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(1);
		});
	});
});
