export function apiError(message: string): Error {
  return Object.assign(new Error(message), { name: "ApiError" })
}
