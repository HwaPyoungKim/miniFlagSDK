import type { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS } from "react-dom/client";
import type {
    FlagConfig,
    FlagName,
    RemoteFlagsPayload,
    UserContext,
    FlagDefaults,
} from "./types"

export class FlagResolver {
    private readonly defaults: FlagDefaults;

    constructor(defaults: FlagDefaults = {}) {
        this.defaults = defaults;
    }

    resolveFlag(
        flagName: FlagName,
        remote: RemoteFlagsPayload | null,
        _user?: UserContext
    ): FlagConfig {
        const remoteCfg = remote?.flags?.[flagName];
        if(remoteCfg) {
            return this.normalize(remoteCfg);
        }

        const defaultCfg = this.defaults[flagName];
        if(defaultCfg){
            return this.normalize(defaultCfg);
        }
        return {enabled: false};
    }

    isEnabled(
        flagName: FlagName,
        remote: RemoteFlagsPayload | null,
        user?: UserContext
    ): Boolean {
        return this.resolveFlag(flagName, remote, user).enabled;
    }

    getVariant(
        flagName: FlagName,
        remote: RemoteFlagsPayload | null,
        user?: UserContext
    ): string | null {
        const cfg = this.resolveFlag(flagName, remote, user);
        if(!cfg.enabled) return null;
        return cfg.variant ?? null;
    }

    private normalize(cfg: FlagConfig): FlagConfig {
    return {
      enabled: Boolean(cfg.enabled),
      ...(cfg.variant !== undefined ? { variant: String(cfg.variant) } : {}),
    };
  }
}