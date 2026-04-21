export type CheckResult<T> =
  | { status: "ok"; data: T; fetchedAt: string }
  | { status: "timeout"; ms: number }
  | { status: "not_applicable"; reason: string }
  | { status: "error"; message: string };

export function isOk<T>(r: CheckResult<T>): r is Extract<CheckResult<T>, { status: "ok" }> {
  return r.status === "ok";
}

export function isError<T>(r: CheckResult<T>): r is Extract<CheckResult<T>, { status: "error" }> {
  return r.status === "error";
}
