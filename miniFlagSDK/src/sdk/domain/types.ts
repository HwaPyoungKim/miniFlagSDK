export type FlagName = string

export type FlagConfig = {
    enabled: boolean
    variant?: string
}

export type RemoteFlagsPayload = {
    version: number
    updatedAt: string
    flags: Record<FlagName, FlagConfig>
}

export type SDKStatus = "idle" | "loading" | "ready" | "error"

export type UserContext = {
    userID?: string
    role?: string
    country?: string
}