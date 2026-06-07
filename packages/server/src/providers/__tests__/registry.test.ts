import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { ProviderRegistry } from "../registry"

describe("ProviderRegistry", () => {
  it("contains the built-in OpenCode provider by default", () => {
    const registry = new ProviderRegistry()

    assert.deepEqual(registry.list(), [
      {
        id: "opencode",
        type: "opencode-http",
        name: "OpenCode",
      },
    ])
  })

  it("resolves the built-in OpenCode provider when no id is provided", () => {
    const registry = new ProviderRegistry()

    assert.deepEqual(registry.resolve(), {
      id: "opencode",
      type: "opencode-http",
      name: "OpenCode",
    })
  })

  it("accepts a custom ACP stdio provider with a command", () => {
    const registry = new ProviderRegistry({
      providers: [
        {
          id: "gemini-acp",
          type: "acp-stdio",
          name: "Gemini ACP",
          command: "gemini",
          args: ["--acp"],
          env: { GEMINI_API_KEY: "test-key" },
        },
      ],
    })

    assert.deepEqual(registry.require("gemini-acp"), {
      id: "gemini-acp",
      type: "acp-stdio",
      name: "Gemini ACP",
      command: "gemini",
      args: ["--acp"],
      env: { GEMINI_API_KEY: "test-key" },
    })
  })

  it("rejects duplicate provider ids", () => {
    assert.throws(
      () =>
        new ProviderRegistry({
          providers: [
            {
              id: "opencode",
              type: "acp-stdio",
              name: "Duplicate OpenCode",
              command: "duplicate",
            },
          ],
        }),
      /Duplicate provider id: opencode/,
    )
  })

  it("rejects invalid provider ids", () => {
    assert.throws(
      () =>
        new ProviderRegistry({
          providers: [
            {
              id: "bad provider",
              type: "acp-stdio",
              name: "Bad Provider",
              command: "bad-provider",
            },
          ],
        }),
      /Invalid provider id: bad provider/,
    )
  })

  it("rejects ACP stdio providers without a command", () => {
    assert.throws(
      () =>
        new ProviderRegistry({
          providers: [
            {
              id: "missing-command",
              type: "acp-stdio",
              name: "Missing Command",
            },
          ],
        }),
      /ACP stdio provider requires a command: missing-command/,
    )
  })

  it("rejects an unknown default provider id", () => {
    assert.throws(
      () => new ProviderRegistry({ defaultProviderId: "missing" }),
      /Unknown default provider id: missing/,
    )
  })

  it("throws when requiring an unknown provider id", () => {
    const registry = new ProviderRegistry()

    assert.throws(() => registry.require("missing"), /Unknown provider id: missing/)
  })
})
