const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add placeholder="0" to type="number" if not exists
  content = content.replace(/type="number"(?![^>]*placeholder=)/g, 'type="number" placeholder="0"');
  
  // Replace all values initialized with 0 to '' (for states)
  // For totalAmount, advanceAmount, price, totalQty, balanceAmount etc
  // We'll just replace state initializations like `totalAmount: ''` instead of `totalAmount: 0`
  // Actually, let's just make sure we replace value={... === 0 ? '' : ...} or update initial state
  
  // This replaces initial states where advanceAmount: 0 is used, etc.
  content = content.replace(/advanceAmount:\s*0/g, 'advanceAmount: \'\'');
  content = content.replace(/totalAmount:\s*0/g, 'totalAmount: \'\'');
  content = content.replace(/balanceAmount:\s*0/g, 'balanceAmount: \'\'');
  content = content.replace(/price:\s*0/g, 'price: \'\'');
  
  // If the user wants no integer at all, the totalQty should also not have an integer default if they want placeholder="0" 
  // Let's also do totalQty: 0
  content = content.replace(/totalQty:\s*1/g, 'totalQty: \'\'');
  content = content.replace(/totalQty:\s*0/g, 'totalQty: \'\'');
  
  // Also fix useState(0) to useState('')
  content = content.replace(/useState\(0\)/g, 'useState(\'\')');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath);
    } else if (dirPath.endsWith('.jsx')) {
      replaceInFile(dirPath);
    }
  });
}

walkDir('src/pages');
