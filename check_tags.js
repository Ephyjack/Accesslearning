import fs from 'fs';
const text = fs.readFileSync('src/app/components/TeacherDashboard.tsx', 'utf8');

const lines = text.split('\n');
let divCount = 0;
let mainCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  
  const opens = (line.match(/<div[\s>]/g) || []).length;
  const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
  const closes = (line.match(/<\/div\s*>/g) || []).length;
  
  divCount += opens;
  divCount -= selfCloses;
  divCount -= closes;
  
  const mOpens = (line.match(/<main[\s>]/g) || []).length;
  const mCloses = (line.match(/<\/main\s*>/g) || []).length;
  mainCount += mOpens;
  mainCount -= mCloses;
}

console.log('Final Div:', divCount);
console.log('Final Main:', mainCount);
