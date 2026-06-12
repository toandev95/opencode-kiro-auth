import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { webSearch, type WebSearchResult } from "./mcp"

/**
 * opencode tool definitions backed by Kiro's built-in MCP server.
 *
 * `web_search` mirrors the tool kiro-cli exposes: it runs server-side on Kiro's
 * backend (via the InvokeMCP operation) using the existing kiro-cli login, so it
 * needs no third-party search API key.
 */

function formatResults(query: string, results: WebSearchResult[]): string {
  if (!results.length) {
    return `No web search results found for "${query}".`
  }
  const lines = results.map((r, i) => {
    const n = i + 1
    const title = r.title?.trim() || r.url || `Result ${n}`
    const parts = [`[${n}] ${title}`]
    if (r.url) parts.push(`    ${r.url}`)
    if (r.snippet) parts.push(`    ${r.snippet.replace(/\s+/g, " ").trim()}`)
    return parts.join("\n")
  })
  return [
    `Web search results for "${query}" (via Kiro):`,
    "",
    ...lines,
    "",
    "Cite sources inline as [n](url) when using this information.",
  ].join("\n")
}

const web_search: ToolDefinition = tool({
  description:
    "Search the web for current, up-to-date information using Kiro's built-in web search " +
    "(no API key required). Returns titles, URLs, and snippets. Use for recent events, " +
    "latest versions, pricing, or anything that may have changed since training. " +
    "Always cite sources inline as [n](url).",
  args: {
    query: tool.schema
      .string()
      .max(200, "Query must be 200 characters or fewer.")
      .describe("The search query to execute. Must be 200 characters or fewer."),
  },
  async execute(args) {
    const query = args.query
    const results = await webSearch(query)
    return {
      title: query,
      output: formatResults(query, results),
      metadata: { count: results.length, results },
    }
  },
})

export const tools: Record<string, ToolDefinition> = {
  web_search,
}
