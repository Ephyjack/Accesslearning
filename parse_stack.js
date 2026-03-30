import fs from 'fs';

const text = fs.readFileSync('src/app/components/TeacherDashboard.tsx', 'utf8');

// simple regex to find all opening and closing tags
// format: <Tag, </Tag, <Tag/>
const rx = /<\/?([a-zA-Z0-9_]+)[^>]*>/g;

let stack = [];
let match;

// We will skip JSX expressions `{...}` roughly by stripping them? No, tags inside {...} are valid JSX too!
// The TS compiler parses tags anywhere in JSX mode.

let lineNum = (index) => text.substring(0, index).split('\n').length;

while ((match = rx.exec(text)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  
  if (fullTag.startsWith('</')) {
    // it's a closing tag
    if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
      stack.pop();
    } else {
      console.log(`Mismatch at line ${lineNum(match.index)}: found ${fullTag}, expected ${stack.length > 0 ? stack[stack.length - 1].name : 'none'}`);
    }
  } else if (fullTag.endsWith('/>')) {
    // self closing, do nothing
  } else {
    // opening tag
    // exception for input and img if they are not self closing but in JSX they MUST be self closing
    stack.push({ name: tagName, line: lineNum(match.index), full: fullTag });
  }
}

console.log("Remaining in stack:", stack.map(s => `${s.name} (line ${s.line})`));

