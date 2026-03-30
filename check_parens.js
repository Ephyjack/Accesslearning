import fs from 'fs';
const text = fs.readFileSync('src/app/components/TeacherDashboard.tsx', 'utf8');

const lines = text.split('\n');
let pCount = 0;
let bCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive strip comments 
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  
  for (let char of line) {
    if (char === '(') pCount++;
    if (char === ')') pCount--;
    if (char === '{') bCount++;
    if (char === '}') bCount--;
  }
}

console.log('Final Parens:', pCount);
console.log('Final Braces:', bCount);
