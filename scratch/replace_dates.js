const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../frontend/src/pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex to match new Date(...).toLocaleDateString(...)
  // We need to carefully handle cases like new Date(expense.date).toLocaleDateString()
  // and new Date().toLocaleDateString('en-GB')
  
  // Replace new Date(...).toLocaleDateString(...) with formatDate(...)
  const regex = /new Date\((.*?)\)\.toLocaleDateString\([^)]*\)/g;
  
  let match;
  let hasChanges = false;
  
  content = content.replace(regex, (match, innerArgs) => {
    hasChanges = true;
    return `formatDate(${innerArgs})`;
  });
  
  // Also replace dateObj.toLocaleDateString('en-GB') in ClientDetails.jsx
  if (content.includes("dateObj.toLocaleDateString('en-GB')")) {
    content = content.replace(/dateObj\.toLocaleDateString\('en-GB'\)/g, "formatDate(dateObj)");
    hasChanges = true;
  }

  if (hasChanges) {
    // Add import statement at the top if it doesn't exist
    if (!content.includes('import { formatDate }')) {
      const importStatement = "import { formatDate } from '../utils/formatDate';\n";
      // Insert after the first line (usually import React ...)
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() !== '') {
          break;
        }
      }
      lines.splice(insertIndex, 0, importStatement);
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

walkDir(directoryPath);
console.log('Done!');
