export function serializeForClient<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
