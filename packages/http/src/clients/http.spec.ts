import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "./http";
import { request } from "undici";
import type { Mocked } from "vitest";

vi.mock("undici", async () => {
  const actual = await vi.importActual("undici") as typeof import('undici');
  return {
    ...actual,
    request: vi.fn(),
  };
});

const mockedRequest = request as Mocked<typeof request>;

describe("HttpClient", () => {
  it("should execute a simple GET request", async () => {
    const mockResponse = {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: {
        text: () => Promise.resolve(`{"message": "success"}`),
      },
    };
    mockedRequest.mockResolvedValue(mockResponse as any);

    const client = new HttpClient();
    const response = await client.execute({
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/todos/1",
    });

    expect(response.status).toBe(200);
    expect(response.body).toBe(`{"message": "success"}`);
  });

  it("should handle a POST request with a body", async () => {
    const mockResponse = {
      statusCode: 201,
      headers: {},
      body: {
        text: () => Promise.resolve(""),
      },
    };
    mockedRequest.mockResolvedValue(mockResponse as any);

    const client = new HttpClient();
    await client.execute({
      method: "POST",
      url: "https://jsonplaceholder.typicode.com/posts",
      body: `{"key": "value"}`,
    });

    expect(mockedRequest).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      expect.objectContaining({
        method: "POST",
        body: `{"key": "value"}`,
      })
    );
  });

  it("should throw an HttpError on request failure", async () => {
    mockedRequest.mockRejectedValue(new Error("Network error"));

    const client = new HttpClient();

    await expect(
      client.execute({
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/1",
      })
    ).rejects.toThrow("HTTP request failed: Network error");
  });
});
