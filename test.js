const s = 'x "Eerste zin met quote:" "Tweede zin" 20 85';
let parsed = [];
let accum = "";
let inQuote = false;
for (const i of s) {
  if (i === " " && !inQuote) {
    parsed.push(accum);
    accum = "";
  } else if (i === '"') {
    inQuote = !inQuote;
  } else accum += i;
}
if (accum) parsed.push(accum);
if (inQuote) console.error("Unclosed quote!");
console.log(parsed);
