const fs = require('fs');
const text = fs.readFileSync('infections_disease_agents.json', 'utf8');

let arrDepth = 0;
let inString = false;
let escape = false;

for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === '\\') escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') inString = true;
    else if (c === '[') {
      arrDepth++;
      if (arrDepth > 1) {
        let context = text.substring(Math.max(0, i-20), i+1);
        if (!context.includes('"choices"')) {
           console.log('Found unexpected [ at index', i, 'Depth:', arrDepth, 'Context:', context.replace(/\n/g, '\\n'));
        }
      }
    }
    else if (c === ']') arrDepth--;
  }
}
