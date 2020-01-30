export function capitalize(str: string): string {
  if (str !== undefined && str !== null)
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomChoice<T>(arr: Array<T>): T {
  return arr[Math.random() * arr.length];
}
