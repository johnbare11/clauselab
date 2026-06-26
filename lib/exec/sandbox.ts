import vm from "node:vm"

// Runs a candidate's pure function inside a locked-down V8 context and returns
// whatever it produces. The context exposes no I/O, no `require`, no `process`,
// and no host globals - the function is a pure transform from inputs to an
// XRPL transaction object. A hard timeout guards against infinite loops.
//
// NOTE: node:vm is not a perfect jail. For this MVP the candidate function is
// pure and the context has no reachable secrets or I/O, so the practical blast
// radius is small. Production hardening should move this to isolated-vm or a
// separate worker/container with seccomp.

export interface SandboxResult {
  ok: boolean
  value?: unknown
  error?: string
}

export function runCandidate(
  code: string,
  entry: string,
  input: Record<string, unknown>,
  now: number,
): SandboxResult {
  const sandbox: Record<string, unknown> = {
    Math,
    Number,
    String,
    Array,
    Object,
    JSON,
    Boolean,
    isNaN,
    parseInt,
    parseFloat,
    // Convenience helper available to candidates: XRP -> drops (string).
    drops: (xrp: number) => String(Math.round(Number(xrp) * 1_000_000)),
    __input: input,
    __now: now,
    __result: undefined as unknown,
  }

  const wrapped = `
    "use strict";
    ${code}
    ;__result = (typeof ${entry} === "function")
      ? ${entry}(Object.assign({}, __input, { now: __now }))
      : (function () { throw new Error("Expected a function named ${entry}"); })();
  `

  try {
    const context = vm.createContext(sandbox)
    vm.runInContext(wrapped, context, { timeout: 1000, displayErrors: false })
    return { ok: true, value: sandbox.__result }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
