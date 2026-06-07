export type ProviderType = "opencode-http" | "acp-stdio"

export interface ProviderDefinition {
  id: string
  type: ProviderType
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
}

export type ProviderEvent =
  | { type: "session.ready"; sessionId: string }
  | { type: "message.delta"; role: "assistant"; text: string }
  | { type: "session.done"; reason: string }
  | { type: "session.cancelled" }
  | { type: "session.error"; message: string }
  | { type: "log"; level: "debug" | "info" | "warn" | "error"; message: string }

export interface ProviderSession {
  providerId: string
  sessionId: string
  start(): Promise<void>
  sendPrompt(prompt: string): Promise<void>
  cancel(): Promise<void>
  stop(): Promise<void>
  onEvent(handler: (event: ProviderEvent) => void): () => void
}
