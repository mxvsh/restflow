import { describe, it, expect, vi } from "vitest";
import { EnvironmentManager } from "./environment-manager";
import { DotenvLoader } from "../loaders/env-loader";

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
});
