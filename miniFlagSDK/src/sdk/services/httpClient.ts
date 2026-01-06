import type { RemoteFlagsPayload } from "../domain/types";

export type FlagsHttpClientOptions = {
    baseUrl: string;
    endpointPath?: string;
    timeoutMs?: number;
};

export class FlagsHttpError extends Error {
    public readonly status: number;
    public readonly url: string;

    constructor(message: string, status: number, url: string) {
        super(message);
        this.name = "FlagsHttpError";
        this.status = status;
        this.url = url;
    }
}

export class FlagsParseError extends Error {
    public readonly url: string;

    constructor(message: string, url: string) {
        super(message);
        this.name = "FlagsParseError";
        this.url = url;
    }
}

export class FlagsValidationError extends Error {
    public readonly url: string;

    constructor(message: string, url: string) {
        super(message);
        this.name = "FlagsValidationError";
        this.url = url;
    }
}

export class FlagsHttpClient {
    private baseUrl: string;
    private endpointPath: string;
    private timeoutMs: number;

    constructor(options: FlagsHttpClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, "");
        this.endpointPath = options.endpointPath ?? "/flags.json";
        this.timeoutMs = options.timeoutMs ?? 5000;
    }

    async fetchFlags(): Promise<RemoteFlagsPayload> {
        const url = this.buildUrl();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const res = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" },
                signal: controller.signal,
                cache: "no-store",
            });

            if (!res.ok) {
                throw new FlagsHttpError(
                    `Failed to fetch flags: HTTP ${res.status}`,
                    res.status,
                    url
                );
            }

            let data: unknown;
            try {
                data = await res.json();
            } catch {
                throw new FlagsParseError("Flags response is not valid JSON", url);
            }

            if (!isRemoteFlagsPayload(data)) {
                throw new FlagsValidationError("Flags payload has invalid shape", url);
            }
            return data;

        } catch (err) {
            if (typeof err === "object" && err !== null && "name" in err && (err as any).name === "AbortError") {
                throw new FlagsHttpError("Failed to fetch flags: request timeout", 408, url);
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private buildUrl(): string {
        const ts = Date.now();
        const path = this.endpointPath.startsWith("/") ? this.endpointPath : `/${this.endpointPath}`;
        return `${this.baseUrl}${path}?ts=${ts}`;
    }
}

function isRemoteFlagsPayload(x: unknown): x is RemoteFlagsPayload {
    if (typeof x !== "object" || x === null) return false;

    const obj = x as Record<string, unknown>;
    if (typeof obj.version !== "number") return false;
    if (typeof obj.updatedAt !== "string") return false;

    const flags = obj.flags as unknown;
    if (typeof flags !== "object" || flags === null) return false;
    if (Array.isArray(flags)) return false;

    return true;
}