export function capitalize(str: string): string {
  if (str !== undefined && str !== null)
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomChoice<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

export function validateNumber(
  numberString: string,
  range: [number, number] = [-Infinity, Infinity],
  argName?: string
): number {
  if (numberString === undefined) return undefined;
  let num = parseInt(numberString, 10);
  if (isNaN(num))
    throw { messageToUser: `${numberString} is not a valid number` };
  if (num < range[0] || num > range[1])
    throw {
      messageToUser:
        (argName ? argName + " should" : "Should") +
        ` be between ${range[0]} and ${range[1]}`
    };
  return num;
}
