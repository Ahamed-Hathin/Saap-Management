const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend/src/pages/ClientOrders.jsx');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix header for ClientOrders
  const oldHeaderRegex = /<div style=\{\{ display: 'flex', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' \}\}>\s*<div style=\{\{ flex: 1, textAlign: 'center' \}\}>SL\.<\/div>\s*<div style=\{\{ flex: 3 \}\}>ITEM DESCRIPTION<\/div>\s*<div style=\{\{ flex: 1, textAlign: 'center' \}\}>PRICE<\/div>\s*<div style=\{\{ flex: 1, textAlign: 'right' \}\}>TOTAL<\/div>\s*<\/div>/g;
  
  const newHeader = `<div style={{ display: 'flex', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
              <div style={{ flex: 0.5, textAlign: 'center' }}>SL.</div>
              <div style={{ flex: 2 }}>ITEM NAME</div>
              <div style={{ flex: 1, textAlign: 'center' }}>QTY</div>
              <div style={{ flex: 1, textAlign: 'center' }}>PRICE</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>TOTAL AMOUNT</div>
            </div>`;
            
  if (content.match(oldHeaderRegex)) {
    content = content.replace(oldHeaderRegex, newHeader);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed ClientOrders headers');
  } else {
    console.log('Could not find old header in ClientOrders');
  }
}
