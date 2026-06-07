import type { ProviderDefinition } from "./types"

export const BUILT_IN_OPENCODE_PROVIDER_ID = "opencode"

export const BUILT_IN_OPENCODE_PROVIDER: ProviderDefinition = {
  id: BUILT_IN_OPENCODE_PROVIDER_ID,
  type: "opencode-http",
  name: "OpenCode",
}

export interface ProviderRegistryOptions {
  providers?: ProviderDefinition[]
  defaultProviderId?: string
}

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function isValidProviderId(providerId: string): boolean {
  return PROVIDER_ID_PATTERN.test(providerId)
}

export function validateProviderDefinition(provider: ProviderDefinition): void {
  if (!isValidProviderId(provider.id)) {
    throw new Error(`Invalid provider id: ${provider.id}`)
  }

  if (provider.type === "acp-stdio" && !provider.command) {
    throw new Error(`ACP stdio provider requires a command: ${provider.id}`)
  }
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderDefinition>()
  private readonly defaultProviderId: string

  constructor(options: ProviderRegistryOptions = {}) {
    this.add(BUILT_IN_OPENCODE_PROVIDER)

    for (const provider of options.providers ?? []) {
      this.add(provider)
    }

    this.defaultProviderId = options.defaultProviderId ?? BUILT_IN_OPENCODE_PROVIDER_ID
    if (!this.providers.has(this.defaultProviderId)) {
      throw new Error(`Unknown default provider id: ${this.defaultProviderId}`)
    }
  }

  list(): ProviderDefinition[] {
    return Array.from(this.providers.values())
  }

  get(providerId: string): ProviderDefinition | undefined {
    return this.providers.get(providerId)
  }

  require(providerId: string): ProviderDefinition {
    const provider = this.get(providerId)
    if (!provider) {
      throw new Error(`Unknown provider id: ${providerId}`)
    }
    return provider
  }

  resolve(providerId?: string): ProviderDefinition {
    return this.require(providerId ?? this.defaultProviderId)
  }

  private add(provider: ProviderDefinition): void {
    validateProviderDefinition(provider)

    if (this.providers.has(provider.id)) {
      throw new Error(`Duplicate provider id: ${provider.id}`)
    }
    this.providers.set(provider.id, provider)
  }
}
