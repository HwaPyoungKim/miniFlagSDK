import { describe, it, expect} from "vitest";
import { FlagResolver } from "./resolver"; 
import type { RemoteFlagsPayload } from "./types";

describe("FlagResolver", () => {
    it("remote tiene mayor precedencia que defaults", () => {
        const resolver = new FlagResolver({
            showFeature: {enabled: true},
        });

        const remote: RemoteFlagsPayload = {
            version:1,
            updatedAt: new Date().toISOString(),
            flags:{
                showFeature: { enabled: false },
            },
        };

        const cfg = resolver.resolveFlag("showFeature", remote);
        expect(cfg.enabled).toBe(false);
    });

    it("usa default si no esta remote", () => {
        const resolver = new FlagResolver({
            showFeature: {enabled: true},
        });

        const remote: RemoteFlagsPayload = {
            version:1,
            updatedAt: new Date().toISOString(),
            flags: {},
        }

        const cfg = resolver.resolveFlag("showFeature", remote);
        expect(cfg.enabled).toBe(true);
    });

    it("fallback a disabled si no existe en ningun lado", () => {
        const resolver = new FlagResolver({});

        const cfg = resolver.resolveFlag("missingFlag", null);
        expect(cfg.enabled).toBe(false);
    })

    it("getVariant devuelve null si la flag esta disabled", () => {
        const resolver = new FlagResolver({});
        
        const remote: RemoteFlagsPayload = {
            version:1,
            updatedAt: new Date().toISOString(),
            flags: {
                showFeature: { enabled:false, variant: "B"}
            }
        };

        expect(resolver.getVariant("showFeature", remote)).toBeNull();
    });
});