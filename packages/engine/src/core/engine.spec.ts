import { HttpClient } from "@restflow/http";
import type { Flow, HttpResponse } from "@restflow/types";
import { describe, expect, it, vi } from "vitest";
import { FlowExecutor } from "./engine";

vi.mock("@restflow/http");

describe("FlowExecutor", () => {
	it("should execute a simple flow", async () => {
		const mockResponse: HttpResponse = {
			status: 200,
			statusText: "OK",
			headers: {},
			body: `{"message": "success"}`,
			responseTime: 100,
		};
		const httpClientMock = {
			execute: vi.fn().mockResolvedValue(mockResponse),
		};
		vi.mocked(HttpClient).mockImplementation(() => httpClientMock as any);

		const flow: Flow = {
			steps: [
				{
					name: "Get user",
					request: {
						method: "GET",
						url: "https://jsonplaceholder.typicode.com/users",
					},
					directives: [
						{
							type: "assert",
							expression: "status == 200",
						},
					],
				},
			],
		};

		const executor = new FlowExecutor();
		const result = await executor.executeFlowObject(flow);

		expect(result.success).toBe(true);
		expect(result.steps.length).toBe(1);
		expect(result.steps[0].response?.status).toBe(200);
	});

	it("should fail a flow if an assertion fails", async () => {
		const mockResponse: HttpResponse = {
			status: 404,
			statusText: "Not Found",
			headers: {},
			body: "",
			responseTime: 100,
		};
		const httpClientMock = {
			execute: vi.fn().mockResolvedValue(mockResponse),
		};
		vi.mocked(HttpClient).mockImplementation(() => httpClientMock as any);

		const flow: Flow = {
			steps: [
				{
					name: "Get user",
					request: {
						method: "GET",
						url: "https://jsonplaceholder.typicode.com/users",
					},
					directives: [
						{
							type: "assert",
							expression: "status == 200",
						},
					],
				},
			],
		};

		const executor = new FlowExecutor();
		const result = await executor.executeFlowObject(flow);

		expect(result.success).toBe(false);
	});

	it("should capture variables", async () => {
		const mockResponse: HttpResponse = {
			status: 200,
			statusText: "OK",
			headers: {},
			body: `{"user": {"id": 123}}`,
			responseTime: 100,
		};
		const httpClientMock = {
			execute: vi.fn().mockResolvedValue(mockResponse),
		};
		vi.mocked(HttpClient).mockImplementation(() => httpClientMock as any);

		const flow: Flow = {
			steps: [
				{
					name: "Get user",
					request: {
						method: "GET",
						url: "https://jsonplaceholder.typicode.com/users",
					},
					directives: [
						{
							type: "capture",
							variable: "userId",
							expression: "body.user.id",
						},
					],
				},
			],
		};

		const executor = new FlowExecutor();
		const result = await executor.executeFlowObject(flow);

		expect(result.success).toBe(true);
		expect(result.context.variables.userId).toBe(123);
	});
});
