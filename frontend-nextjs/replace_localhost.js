const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
let changedFiles = 0;

files.forEach(file => {
  if (file.includes('http.ts')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace double quotes
  content = content.replace(/"http:\/\/localhost:5149(.*?)"/g, "`\\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}$1`");
  
  // Replace single quotes
  content = content.replace(/'http:\/\/localhost:5149(.*?)'/g, "`\\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}$1`");

  // Replace backticks (template literals)
  // Warning: If it's already a template literal `http://localhost:5149/api/${id}`, it becomes `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/${id}`
  content = content.replace(/http:\/\/localhost:5149/g, "${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}");

  // Fix the cases where we replaced backticks inside double quotes incorrectly above
  // Wait, if I do double quotes first, then backticks, the backtick replace will hit the fallback strings!
  // e.g. 'http://localhost:5149' -> `${... || 'http://localhost:5149'}` -> `${... || '${... || 'http...

  // Let's restart the replace logic to be safer
  content = originalContent;
  
  // 1. Just replace http://localhost:5149 with ${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'} 
  // BUT only if it is NOT already inside the fallback.
  // Actually, easiest way:
  // Convert all "http://localhost:5149/..." and 'http://localhost:5149/...' to `http://localhost:5149/...`
  content = content.replace(/"http:\/\/localhost:5149(.*?)"/g, "`http://localhost:5149$1`");
  content = content.replace(/'http:\/\/localhost:5149(.*?)'/g, "`http://localhost:5149$1`");
  
  // Then replace `http://localhost:5149 with `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}
  content = content.replace(/`http:\/\/localhost:5149/g, "`\\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated', file);
  }
});
console.log('Total files changed:', changedFiles);
