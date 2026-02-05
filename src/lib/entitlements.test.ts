import { describe, it, expect } from "vitest";
import { hasEntitlement, getEffectiveEntitlements, hasAccessToFeature } from "./entitlements";

describe("hasEntitlement", () => {
    it("grants admin access to everything", () => {
        expect(hasEntitlement([], "admin", "any_feature")).toBe(true);
    });

    it("checks user entitlements", () => {
        expect(hasEntitlement(["wp_ai_agent"], "free", "wp_ai_agent")).toBe(true);
        expect(hasEntitlement([], "free", "wp_ai_agent")).toBe(false);
    });

    it("checks base tier grants", () => {
        expect(hasEntitlement([], "early_access", "wp_ai_agent")).toBe(true);
        expect(hasEntitlement([], "free", "wp_ai_agent")).toBe(false);
    });

    it("stacks user entitlements on top of base tier", () => {
        expect(hasEntitlement(["social_automation"], "free", "social_automation")).toBe(true);
    });
});

describe("getEffectiveEntitlements", () => {
    it("returns all entitlements for admin", () => {
        expect(getEffectiveEntitlements([], "admin")).toEqual(["*"]);
    });

    it("merges base tier and user entitlements", () => {
        const result = getEffectiveEntitlements(["ai_video"], "early_access");
        expect(result).toContain("social_automation");
        expect(result).toContain("ai_video");
    });

    it("removes duplicates", () => {
        const result = getEffectiveEntitlements(["social_automation"], "early_access");
        const socialAutomationCount = result.filter(e => e === "social_automation").length;
        expect(socialAutomationCount).toBe(1);
    });
});

describe("hasAccessToFeature", () => {
    it("checks feature access via entitlements", () => {
        expect(hasAccessToFeature(["wp_ai_agent"], "free", "wordpress_tool")).toBe(true);
        expect(hasAccessToFeature([], "free", "wordpress_tool")).toBe(false);
        expect(hasAccessToFeature([], "early_access", "wordpress_tool")).toBe(true);
    });

    it("grants admin access to all features", () => {
        expect(hasAccessToFeature([], "admin", "wordpress_tool")).toBe(true);
        expect(hasAccessToFeature([], "admin", "social_automation")).toBe(true);
    });
});
