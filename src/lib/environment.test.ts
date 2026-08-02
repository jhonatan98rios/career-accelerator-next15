import { afterEach, describe, it } from "node:test";
// expect is global from test-setup.ts (chai + @vitest/expect)

// Fresh module per test: dynamic import with cache-busting query forces
// re-evaluation, so each test sees its own process.env.ENVIRONMENT.
async function loadEnvironment(env?: string) {
  if (env === undefined) delete process.env.ENVIRONMENT;
  else process.env.ENVIRONMENT = env;
  return import(`./environment.ts?test=${Math.random()}`);
}

describe("environment", () => {
  afterEach(() => delete process.env.ENVIRONMENT);

  it("defaults to development when ENVIRONMENT is unset", async () => {
    const mod = await loadEnvironment();
    expect(mod.environment).toBe("development");
    expect(mod.isDevelopment).toBe(true);
    expect(mod.isProduction).toBe(false);
  });

  it("reads production", async () => {
    const mod = await loadEnvironment("production");
    expect(mod.environment).toBe("production");
    expect(mod.isProduction).toBe(true);
    expect(mod.isDevelopment).toBe(false);
  });

  it("reads development", async () => {
    const mod = await loadEnvironment("development");
    expect(mod.isDevelopment).toBe(true);
    expect(mod.isProduction).toBe(false);
  });
});
