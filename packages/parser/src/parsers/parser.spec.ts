import { describe, it, expect } from "vitest";
import { parseFlow } from "./parser";

describe("parseFlow", () => {
  it("should parse a simple flow with one step", () => {
    const flowContent = `
### Get user
GET https://jsonplaceholder.typicode.com/users
> assert status == 200
    `;
    const result = parseFlow(flowContent);

    expect(result.errors.length).toBe(0);
    expect(result.flow.steps.length).toBe(1);
    expect(result.flow.steps[0].name).toBe("Get user");
    expect(result.flow.steps[0].request.method).toBe("GET");
    expect(result.flow.steps[0].directives.length).toBe(1);
  });

  it("should parse a flow with multiple steps", () => {
    const flowContent = `
### Step 1
GET /
### Step 2
POST /login
    `;
    const result = parseFlow(flowContent);

    expect(result.errors.length).toBe(0);
    expect(result.flow.steps.length).toBe(2);
  });

  it("should parse a request with headers and body", () => {
    const flowContent = `
### Create user
POST https://jsonplaceholder.typicode.com/users
Content-Type: application/json
{
  "name": "Jules"
}
    `;
    const result = parseFlow(flowContent);

    expect(result.flow.steps[0].request.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(result.flow.steps[0].request.body).toBe(`{\n  "name": "Jules"\n}`);
  });
});
