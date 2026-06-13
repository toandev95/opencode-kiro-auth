import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { KiroEvent } from "./eventstream"

/**
 * Opt-in event capture for reverse-engineering Kiro's wire format (e.g. locating
 * a token-usage / metadata event). Enabled only when KIRO_DEBUG_EVENTS is set.
 *
 * Writes to KIRO_DEBUG_FILE if provided, otherwise <tmp>/kiro-events.log.
 * To avoid dumping whole assistant messages, streamed content events are logged
 * as a length summary; every other event is logged with its full payload, which
 * is where any usage/metadata fields would live.
 */
const ENABLED = Boolean(process.env.KIRO_DEBUG_EVENTS)
const LOG_FILE = process.env.KIRO_DEBUG_FILE || join(tmpdir(), "kiro-events.log")

export function isDebugEnabled(): boolean {
  return ENABLED
}

export function logKiroEvent(ev: KiroEvent): void {
  if (!ENABLED) return
  try {
    let line: string
    if (ev.eventType === "assistantResponseEvent") {
      const content = (ev.payload as { content?: unknown }).content
      const len = typeof content === "string" ? content.length : 0
      line = `${ev.eventType} {contentLength:${len}}`
    } else {
      line = `${ev.eventType} ${JSON.stringify(ev.payload)}`
    }
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`)
  } catch {
    // never let debugging break the stream
  }
}

export function debugLogPath(): string {
  return LOG_FILE
}
