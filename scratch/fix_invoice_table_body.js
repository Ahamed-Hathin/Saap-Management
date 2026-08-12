const fs = require('fs');
const path = require('path');

const fixTableBody = () => {
  const files = [
    'frontend/src/pages/ManageOrders.jsx',
    'frontend/src/pages/ClientOrders.jsx'
  ];

  for (const relPath of files) {
    const filePath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');

    const oldTableBody = `{/* Table Body */}
            <div style={{ display: 'flex', fontSize: '15px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>1</div>
              <div style={{ flex: 3 }}>{downloadInvoice.cardType || '-'}
                {downloadInvoice.description && (
                  <div style={{ marginTop: '5px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{downloadInvoice.description}</div>
                )}
              </div>
              <div style={{ flex: 1.2, textAlign: 'center' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>
            </div>`;

    const newTableBody = `{/* Table Body */}
            {downloadInvoice.items && downloadInvoice.items.length > 0 ? (
              downloadInvoice.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', fontSize: '15px', marginBottom: '8px' }}>
                  <div style={{ flex: 0.5, textAlign: 'center' }}>{idx + 1}</div>
                  <div style={{ flex: 2 }}>{item.itemName}</div>
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
            )}`;

    // Fallback if formatting doesn't match perfectly, use regex matching just the tags
    const oldTableBodyRegex = /\{\/\* Table Body \*\/\}\s*<div style=\{\{ display: 'flex', fontSize: '15px' \}\}>\s*<div style=\{\{ flex: 1, textAlign: 'center' \}\}>1<\/div>\s*<div style=\{\{ flex: 3 \}\}>\{downloadInvoice\.cardType \|\| '-'\}\s*\{downloadInvoice\.description && \(\s*<div style=\{\{ marginTop: '5px', fontSize: '14px', whiteSpace: 'pre-wrap' \}\}>\{downloadInvoice\.description\}<\/div>\s*\)\}\s*<\/div>\s*<div style=\{\{ flex: 1\.2, textAlign: 'center' \}\}>\{downloadInvoice\.totalAmount\?\.toFixed\(2\)\}<\/div>\s*<div style=\{\{ flex: 1\.2, textAlign: 'right' \}\}>\{downloadInvoice\.totalAmount\?\.toFixed\(2\)\}<\/div>\s*<\/div>/g;

    if (content.includes(oldTableBody)) {
      content = content.replace(oldTableBody, newTableBody);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed Table Body exactly in ' + relPath);
    } else if (content.match(oldTableBodyRegex)) {
      content = content.replace(oldTableBodyRegex, newTableBody);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed Table Body via regex in ' + relPath);
    } else {
      console.log('Could not find Table Body in ' + relPath);
    }
  }
}

fixTableBody();
