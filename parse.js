import { readFileSync } from 'fs';
import * as babel from '@babel/core';

const src = readFileSync('src/app/components/TeacherDashboard.tsx', 'utf8');
try {
  babel.transformSync(src, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'TeacherDashboard.tsx'
  });
  console.log("Parse Success!");
} catch (e) {
  console.error("Parse Error:", e.message);
}
