const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.cjs')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Regex to match git conflict markers and keep the bottom branch (march-update)
      // Note: DotAll mode (?s) is not standard in old JS, so we use [\s\S]*?
      const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> [^\r\n]*/g;
      
      if (regex.test(content)) {
        console.log(`Fixing conflicts in ${filePath}`);
        // Replace with the second group (the bottom part)
        const newContent = content.replace(regex, '$2');
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
    }
  }
}

processDir(__dirname);
console.log("Done resolving conflicts.");
