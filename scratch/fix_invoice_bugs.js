const fs = require('fs');
const path = require('path');

const fixInvoiceDownloads = () => {
  const files = [
    'frontend/src/pages/ManageOrders.jsx',
    'frontend/src/pages/ClientOrders.jsx',
  ];

  for (const relPath of files) {
    const filePath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Fix setTimeout to 500ms
    content = content.replace(/setTimeout\(async \(\) => \{\n\s*if \(invoiceRef\.current\) \{\n\s*try \{\n\s*const canvas = await html2canvas/g, 
      `setTimeout(async () => {
      if (invoiceRef.current) {
        try {
          const canvas = await html2canvas`);
    
    // Replace the timer from 100 to 500
    content = content.replace(/\}, 100\);/g, '}, 500);');
    content = content.replace(/\}, 0\);/g, '}, 500);');

    // 2. Add Total Amount row at the bottom of items in the table body
    // Find the end of the table body mapping
    const tableBodyRegex = /downloadInvoice\.items\.map\(\(item, idx\) => \([\s\S]*?<\/div>\s*\)\)\s*\)\s*:\s*\([\s\S]*?<\/div>\s*\)\}/;
    
    if (content.match(tableBodyRegex)) {
      const summaryRow = `
            {/* Total Amount Row */}
            <div style={{ borderTop: '2px dashed #000', margin: '10px 0' }}></div>
            <div style={{ display: 'flex', fontSize: '15px', fontWeight: 'bold' }}>
              <div style={{ flex: 3.5, textAlign: 'right', paddingRight: '15px' }}>Total Amount:</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>{(downloadInvoice.totalAmount || 0).toFixed(2)}</div>
            </div>`;
            
      content = content.replace(tableBodyRegex, (match) => match + summaryRow);
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }
}

fixInvoiceDownloads();
console.log('Fixed invoice downloads');
