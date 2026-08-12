const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/ManageOrders.jsx',
  'frontend/src/pages/ClientOrders.jsx',
];

for (const relPath of files) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix header
  const oldHeaderRegex = /<div style=\{\{ display: 'flex', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px' \}\}>\s*<div style=\{\{ flex: 1, textAlign: 'center' \}\}>SL\.<\/div>\s*<div style=\{\{ flex: 3 \}\}>ITEM DESCRIPTION<\/div>\s*<div style=\{\{ flex: 1\.2, textAlign: 'center' \}\}>PRICE<\/div>\s*<div style=\{\{ flex: 1\.2, textAlign: 'right' \}\}>TOTAL<\/div>\s*<\/div>/g;
  
  const newHeader = `<div style={{ display: 'flex', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px' }}>
              <div style={{ flex: 0.5, textAlign: 'center' }}>SL.</div>
              <div style={{ flex: 2 }}>ITEM NAME</div>
              <div style={{ flex: 1, textAlign: 'center' }}>QTY</div>
              <div style={{ flex: 1, textAlign: 'center' }}>PRICE</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>TOTAL AMOUNT</div>
            </div>`;
            
  if (content.match(oldHeaderRegex)) {
    content = content.replace(oldHeaderRegex, newHeader);
  } else {
    // Maybe they already have QTY in header?
    console.log('Could not find old header in ' + relPath);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// EmployeeDashboard.jsx
const empPath = path.join(__dirname, '..', 'frontend/src/pages/EmployeeDashboard.jsx');
if (fs.existsSync(empPath)) {
  let empContent = fs.readFileSync(empPath, 'utf8');
  empContent = empContent.replace(
    /head: \[\['SL\.', 'Item Description', 'Qty', 'PRICE', 'Total'\]\]/g,
    `head: [['SL.', 'Item Name', 'Qty', 'Price', 'Total Amount']]`
  );
  fs.writeFileSync(empPath, empContent, 'utf8');
}

console.log("Updated invoice headers");
