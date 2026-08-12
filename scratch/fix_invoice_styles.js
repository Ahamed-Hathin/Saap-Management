const fs = require('fs');
const path = require('path');

const fixInvoiceStyles = () => {
  const files = [
    'frontend/src/pages/ManageOrders.jsx',
    'frontend/src/pages/ClientOrders.jsx'
  ];

  for (const relPath of files) {
    const filePath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Reduce INVOICE text size by 3px
    content = content.replace(
      /<div style=\{\{ fontWeight: 'bold', fontSize: '22px', textAlign: 'center', marginBottom: '5px' \}\}>INVOICE<\/div>/g,
      `<div style={{ fontWeight: 'bold', fontSize: '19px', textAlign: 'center', marginBottom: '5px' }}>INVOICE</div>`
    );

    // 2. Increase logo size by 3px
    content = content.replace(
      /<img src=\{logo\} alt="Company Logo" style=\{\{ maxWidth: '100px', maxHeight: '50px' \}\} \/>/g,
      `<img src={logo} alt="Company Logo" style={{ maxWidth: '103px', maxHeight: '53px' }} />`
    );

    // 3. Add S.No
    const oldClientInfo = `<div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px' }}>
              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>Invoice to</span><span>: {downloadInvoice.clientName || 'Client Name'}</span></div>
              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>Mobile</span><span>: {downloadInvoice.mobileNumber || '-'}</span></div>
            </div>`;
    
    const newClientInfo = `<div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px' }}>
              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>S.No</span><span>: {downloadInvoice.serialNumber || '-'}</span></div>
              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>Invoice to</span><span>: {downloadInvoice.clientName || 'Client Name'}</span></div>
              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>Mobile</span><span>: {downloadInvoice.mobileNumber || '-'}</span></div>
            </div>`;

    if (content.includes(oldClientInfo)) {
        content = content.replace(oldClientInfo, newClientInfo);
        console.log(`Updated client info EXACT MATCH in ${relPath}`);
    } else {
        // Regex fallback
        const regex = /<div style=\{\{ display: 'flex' \}\}>\s*<span style=\{\{width: '100px'\}\}>Invoice to<\/span>\s*<span>: \{downloadInvoice\.clientName \|\| 'Client Name'\}<\/span>\s*<\/div>/g;
        content = content.replace(regex, `<div style={{ display: 'flex' }}><span style={{width: '100px'}}>S.No</span><span>: {downloadInvoice.serialNumber || '-'}</span></div>\n              <div style={{ display: 'flex' }}><span style={{width: '100px'}}>Invoice to</span><span>: {downloadInvoice.clientName || 'Client Name'}</span></div>`);
        console.log(`Updated client info REGEX in ${relPath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }
}

fixInvoiceStyles();
