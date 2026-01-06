import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
    FlagsHttpClient,
    FlagsHttpError,
    FlagsParseError,
    FlagsValidationError,
} from "./httpClient";

function mockFetchOnce(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<any>) {
    globalThis.fetch = vi.fn(impl);
}

describe("FlagsHttpClient", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("devuelve payload valido cuando la respuesta es OK y el JSON tiene shape minimo", async () => {
        const payload = {
            version: 1,
            updatedAt: new Date().toISOString(),
            flags: { showFeature: { enabled: true } }
        };

        mockFetchOnce(async () => ({
            ok: true,
            status: 200,
            json: async () => payload,
        }));

        const client = new FlagsHttpClient({ baseUrl: "http://localhost:5173" });
        const result = await client.fetchFlags();

        expect(result.version).toBe(1);
        expect(result.flags.showFeature.enabled).toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("lanza FlagsHttpError si HTTP no es ok", async () => {
        mockFetchOnce(async () => ({
            ok: false,
            status: 500,
            json: async () => ({ error: "server" }),
        }));

        const client = new FlagsHttpClient({ baseUrl: "http://localhost:5173" });
        const p = client.fetchFlags();
        await expect(p).rejects.toBeInstanceOf(FlagsHttpError);
        await expect(p).rejects.toMatchObject({ status: 500 });
    });

    it("lanza FlagParseError si la respuesta no es JSON valido", async () => {
        mockFetchOnce(async () => ({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error("invalid json");
            }
        }));

        const client = new FlagsHttpClient({ baseUrl: "http://localhost:5173" });

        await expect(client.fetchFlags()).rejects.toBeInstanceOf(FlagsParseError);
    });

    it("lanza FlagsValidationError si el payload no tiene shape minimo", async () => {
        const invalidPayload = {
            updatedAt: new Date().toISOString(),
            flags: {},
        };

        mockFetchOnce(async () => ({
            ok: true,
            status: 200,
            json: async () => invalidPayload,
        }));

        const client = new FlagsHttpClient({ baseUrl: "http://localhost:5173" });

        await expect(client.fetchFlags()).rejects.toBeInstanceOf(FlagsValidationError);
    });

    it("lanza FlagsHttpError con status 408 en timeout", async () => {
        mockFetchOnce(async (_input, init) => {
            return new Promise((_resolve, reject) => {
                const signal = init?.signal as AbortSignal | undefined;
                if (!signal) return;
                signal.addEventListener("abort", () => {
                    reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
                });
            });
        });

        const client = new FlagsHttpClient({
            baseUrl: "http://localhost:5173",
            timeoutMs: 1000,
        });

        const p = client.fetchFlags();

        const handled = p.catch((e) => e);

        await vi.advanceTimersByTimeAsync(1001);

        const err = await handled;
        expect(err).toBeInstanceOf(FlagsHttpError);
        expect(err.status).toBe(408);
    });
});