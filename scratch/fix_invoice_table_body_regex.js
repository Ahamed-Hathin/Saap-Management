const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/ManageOrders.jsx',
  'frontend/src/pages/ClientOrders.jsx'
];

for (const relPath of files) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace everything between {/* Table Body */} and {/* Payment Summary */}
  const regex = /\{\/\* Table Body \*\/\}([\s\S]*?)\{\/\* Payment Summary \*\/\}/;
  
  const newSection = `{/* Table Body */}
            {downloadInvoice.items && downloadInvoice.items.length > 0 ? (
              downloadInvoice.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', fontSize: '15px', marginBottom: '8px' }}>
                  <div style={{ flex: 0.5, textAlign: 'center' }}>{idx + 1}</div>
                  <div style={{ flex: 2 }}>{item.itemName || '-'}</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>{item.totalQty || 1}</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>{item.price?.toFixed(2) || '0.00'}</div>
                  <div style={{ flex: 1.2, textAlign: 'right' }}>{(item.price || 0).toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', fontSize: '15px' }}>
                <div style={{ flex: 0.5, textAlign: 'center' }}>1</div>
                <div style={{ flex: 2 }}>{downloadInvoice.itemName || downloadInvoice.cardType || '-'}
                  {downloadInvoice.description && (
                    <div style={{ marginTop: '5px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{downloadInvoice.description}</div>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>{downloadInvoice.totalQty || 1}</div>
                <div style={{ flex: 1, textAlign: 'center' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>
                <div style={{ flex: 1.2, textAlign: 'right' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>
              </div>
            )}

            {/* Total Amount Row */}
            <div style={{ borderTop: '2px dashed #000', margin: '10px 0' }}></div>
            <div style={{ display: 'flex', fontSize: '15px', fontWeight: 'bold' }}>
              <div style={{ flex: 3.5, textAlign: 'right', paddingRight: '15px' }}>Total Amount:</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>{(downloadInvoice.totalAmount || 0).toFixed(2)}</div>
            </div>

            <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

            {/* Payment Summary */}`;

  if (content.match(regex)) {
    content = content.replace(regex, newSection);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Table Body in ' + relPath);
  } else {
    console.log('Could not find regex in ' + relPath);
  }
}
