const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'src');
const BAD = /[\u2018\u2019\u201C\u201D]/;
let badFound = false;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.vite' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx|js|jsx|json|md|html|css)$/i.test(entry.name)) {
      try {
        const txt = fs.readFileSync(full, 'utf8');
        if (BAD.test(txt)) {
          badFound = true;
          console.error(`Smart quotes found in: ${path.relative(path.join(__dirname, '..'), full)}`);
        }
      } catch {}
    }
  }
}

try { walk(ROOT); } catch {}

if (badFound) {
  console.error("\nSmart quotes detected. Replace ‘ ’ “ ” with ASCII equivalents.");
  process.exit(1);
}
console.log('✅ No smart quotes found.');
process.exit(0);
