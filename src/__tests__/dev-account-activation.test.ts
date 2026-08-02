import { describe, it } from "node:test";
import { readFileSync } from "fs";
import path from "path";

// expect is global from test-setup.ts (chai + @vitest/expect)

const base = path.resolve(import.meta.dirname ?? __dirname, "..");

const registerRoutePath = path.resolve(base, "app/api/auth/register/route.ts");
const gatewayPath = path.resolve(base, "app/gateway/page.tsx");
const changePlanPath = path.resolve(base, "app/actions/change_plan.ts");
const cancelSubscriptionPath = path.resolve(
  base,
  "app/config/cancel-subscription/confirm/page.tsx"
);

const registerRoute = readFileSync(registerRoutePath, "utf-8");
const gatewayPage = readFileSync(gatewayPath, "utf-8");
const changePlan = readFileSync(changePlanPath, "utf-8");
const cancelSubscriptionPage = readFileSync(cancelSubscriptionPath, "utf-8");

// ── AC-1: POST /register — dev mode active creation ─────────────────

describe("POST /register — dev mode", () => {
  it("imports isDevelopment from environment module", () => {
    expect(registerRoute).toContain('import { isDevelopment } from "@/lib/environment"');
  });

  it("branches on isDevelopment before creating inactive user", () => {
    const devBranch = registerRoute.indexOf("if (isDevelopment)");
    const inactiveLog = registerRoute.indexOf("Creating a new inactive user");
    expect(devBranch).toBeGreaterThan(0);
    expect(inactiveLog).toBeGreaterThan(0);
    expect(devBranch).toBeLessThan(inactiveLog);
  });

  it("creates profile with ACTIVE status in dev branch", () => {
    expect(registerRoute).toContain("status: UserStatus.ACTIVE");
  });

  it("skips createSubscription in dev branch", () => {
    // createSubscription must NOT appear before the dev block closes (return)
    const devBranchStart = registerRoute.indexOf("if (isDevelopment)");
    const devBranchReturn = registerRoute.indexOf(
      "return NextResponse.json(null, { status: HttpStatus.CREATED });",
      devBranchStart
    );
    const createSubInDev = registerRoute.indexOf("createSubscription", devBranchStart);
    expect(createSubInDev === -1 || createSubInDev > devBranchReturn).toBe(true);
  });

  it("skips sendPaymentEmail in dev branch", () => {
    const devBranchStart = registerRoute.indexOf("if (isDevelopment)");
    const devBranchReturn = registerRoute.indexOf(
      "return NextResponse.json(null, { status: HttpStatus.CREATED });",
      devBranchStart
    );
    const sendEmailInDev = registerRoute.indexOf("sendPaymentEmail", devBranchStart);
    expect(sendEmailInDev === -1 || sendEmailInDev > devBranchReturn).toBe(true);
  });

  it("creates Persona in dev branch", () => {
    expect(registerRoute).toContain("Persona.create");
    // Persona appears twice (dev + prod), both ok
  });

  it("prod branch still creates INACTIVE profile", () => {
    expect(registerRoute).toContain("status: UserStatus.INACTIVE");
  });

  it("prod branch still calls createSubscription and sendPaymentEmail", () => {
    expect(registerRoute).toContain("createSubscription");
    expect(registerRoute).toContain("sendPaymentEmail");
  });
});

// ── AC-2: Gateway — dev auto-activation ─────────────────────────────

describe("Gateway — dev mode auto-activate", () => {
  it("imports isDevelopment from environment module", () => {
    expect(gatewayPage).toContain('import { isDevelopment } from "@/lib/environment"');
  });

  it("auto-activates inactive profile in dev before Stripe recreation", () => {
    const devGate = gatewayPage.indexOf("if (isDevelopment) {");
    const stripeRecreationLog = gatewayPage.indexOf('"User inactive, creating new subscription"');
    expect(devGate).toBeGreaterThan(0);
    expect(stripeRecreationLog).toBeGreaterThan(0);
    // dev gate appears before the inactive re-subscription log
    expect(devGate).toBeLessThan(stripeRecreationLog);
  });

  it("calls Profile.findByIdAndUpdate to set ACTIVE in dev path", () => {
    expect(gatewayPage).toContain(
      "await Profile.findByIdAndUpdate(user._id, { status: UserStatus.ACTIVE })"
    );
  });

  it("logs dev auto-activation", () => {
    expect(gatewayPage).toContain('"Dev mode: auto-activating inactive profile"');
  });

  it("falls through to ACTIVE check after dev activation", () => {
    // user.status = UserStatus.ACTIVE is set, then block closes without return
    expect(gatewayPage).toContain("user.status = UserStatus.ACTIVE;");
    // ACTIVE check still exists
    expect(gatewayPage).toContain("user.status === UserStatus.ACTIVE");
  });
});

// ── AC-3: ChangePlan — dev direct update ────────────────────────────

describe("ChangePlan — dev mode direct update", () => {
  it("imports isDevelopment from environment module", () => {
    expect(changePlan).toContain('import { isDevelopment } from "@/lib/environment"');
  });

  it("updates plan directly in dev, skips Stripe checkout", () => {
    const devGate = changePlan.indexOf("if (isDevelopment)");
    const stripeCheckout = changePlan.indexOf("checkoutUrl");
    expect(devGate).toBeGreaterThan(0);
    expect(stripeCheckout).toBeGreaterThan(0);
    expect(devGate).toBeLessThan(stripeCheckout);
  });

  it("uses Profile.findOneAndUpdate for direct plan change in dev", () => {
    expect(changePlan).toContain("Profile.findOneAndUpdate({ email }, { plan })");
  });

  it("redirects to profile page in dev (no Stripe)", () => {
    expect(changePlan).toContain("redirect(`/profile/${user._id}`)");
  });

  it("logs dev mode plan update", () => {
    expect(changePlan).toContain('"Dev mode: plan updated directly"');
  });
});

// ── AC-4: CancelSubscription — dev skip Stripe ──────────────────────

describe("CancelSubscription — dev mode skip", () => {
  it("imports isDevelopment from environment module", () => {
    expect(cancelSubscriptionPage).toContain('import { isDevelopment } from "@/lib/environment"');
  });

  it("redirects to logout in dev before subscriptionId check", () => {
    const devGate = cancelSubscriptionPage.indexOf("if (isDevelopment)");
    const subIdCheck = cancelSubscriptionPage.indexOf("!user.subscriptionId");
    expect(devGate).toBeGreaterThan(0);
    expect(subIdCheck).toBeGreaterThan(0);
    expect(devGate).toBeLessThan(subIdCheck);
  });

  it("skips cancelSubscription() call in dev", () => {
    expect(cancelSubscriptionPage).toContain(
      '"Dev mode: skipping Stripe subscription cancellation"'
    );
  });

  it("redirects to /auth/logout in dev path", () => {
    expect(cancelSubscriptionPage).toContain('redirect("/auth/logout")');
  });

  it("prod path still calls cancelSubscription", () => {
    expect(cancelSubscriptionPage).toContain("cancelSubscription");
  });
});
