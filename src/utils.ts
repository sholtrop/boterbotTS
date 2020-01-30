export function capitalize(str: string): string {
  if (str !== undefined && str !== null)
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomChoice<T>(arr: Array<T>): T {
  return arr[Math.random() * arr.length];
}

export function asyncSleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function hmsToSeconds(time: string): number {
  var p = time.split(":"),
    s = 0,
    m = 1;
  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }
  return s;
}
