// Run: bun run script/test-websearch.ts
// End-to-end check of the implemented web_search module against the live Kiro backend.
import { webSearch } from "../src/mcp"

const query = process.argv[2] ?? "latest Node.js LTS version 2026"
console.log("query:", query)
const results = await webSearch(query)
console.log("result count:", results.length)
for (const r of results.slice(0, 5)) {
  console.log("-", r.title, "=>", r.url)
}
if (!results.length) process.exit(1)
