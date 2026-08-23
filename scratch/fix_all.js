const fs = require('fs');

function fixManageOrders() {
  const path = 'frontend/src/pages/ManageOrders.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // 1. Remove TOTAL AMOUNT from invoice table
  // Header
  const headerTarget = `<div style={{ flex: 0.8, textAlign: 'center' }}>QTY</div>
              <div style={{ flex: 1.2, textAlign: 'right', paddingRight: '15px' }}>PRICE</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>TOTAL AMOUNT</div>`;
  const headerReplacement = `<div style={{ flex: 0.8, textAlign: 'center' }}>QTY</div>
              <div style={{ flex: 1.2, textAlign: 'right' }}>PRICE</div>`;
  content = content.replace(headerTarget, headerReplacement);

  // Body map
  const bodyMapTarget = `<div style={{ flex: 0.8, textAlign: 'center' }}>{item.totalQty || 1}</div>
                  <div style={{ flex: 1.2, textAlign: 'right', paddingRight: '15px' }}>{item.price?.toFixed(2) || '0.00'}</div>
                  <div style={{ flex: 1.2, textAlign: 'right' }}>{((item.totalQty || 1) * (item.price || 0)).toFixed(2)}</div>`;
  const bodyMapReplacement = `<div style={{ flex: 0.8, textAlign: 'center' }}>{item.totalQty || 1}</div>
                  <div style={{ flex: 1.2, textAlign: 'right' }}>{item.price?.toFixed(2) || '0.00'}</div>`;
  content = content.replace(bodyMapTarget, bodyMapReplacement);

  // Fallback body
  const fallbackTarget = `<div style={{ flex: 0.8, textAlign: 'center' }}>{downloadInvoice.totalQty || 1}</div>
                <div style={{ flex: 1.2, textAlign: 'right', paddingRight: '15px' }}>{(downloadInvoice.pricePerQty || downloadInvoice.price || 0).toFixed(2)}</div>
                <div style={{ flex: 1.2, textAlign: 'right' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>`;
  const fallbackReplacement = `<div style={{ flex: 0.8, textAlign: 'center' }}>{downloadInvoice.totalQty || 1}</div>
                <div style={{ flex: 1.2, textAlign: 'right' }}>{downloadInvoice.totalAmount?.toFixed(2)}</div>`;
  content = content.replace(fallbackTarget, fallbackReplacement);

  // 2. Invoice Background
  const invoiceHeaderTarget = `{/* Header */}
            <div style={{ fontWeight: 'bold', fontSize: '19px', textAlign: 'center', marginBottom: '5px' }}>INVOICE</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              <img src={logoImg} alt="SAPP Creation Logo" style={{ height: '50px' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '10px' }}>
              <div>No.3/4, Shop No.03, 1st Floor, Alam Tower, Allimal St, Trichy - 8.</div>
              <div>Ph: 0431-4010547, Cell: 88833 72047</div>
            </div>`;
  const invoiceHeaderReplacement = `{/* Header */}
            <div style={{ backgroundColor: 'rgba(253, 192, 47, 0.15)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '19px', textAlign: 'center', marginBottom: '5px' }}>INVOICE</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                <img src={logoImg} alt="SAPP Creation Logo" style={{ height: '50px' }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px' }}>
                <div>No.3/4, Shop No.03, 1st Floor, Alam Tower, Allimal St, Trichy - 8.</div>
                <div>Ph: 0431-4010547, Cell: 88833 72047</div>
              </div>
            </div>`;
  content = content.replace(invoiceHeaderTarget, invoiceHeaderReplacement);

  const invoiceFooterTarget = `{/* Footer */}
            <div style={{ fontSize: '10px', marginTop: '10px', textAlign: 'left', lineHeight: '1.2' }}>
              <strong>Terms & Condition:</strong><br />
              1. 50% Advance Payment should be paid at the time of Order Placement.<br />
              2. Credit Facility not Available ( Make the Full Payment at the time of delivery ).
            </div>
            <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#000', fontWeight: 'bold', marginTop: '15px', fontSize: '16px' }}>
              Thank you for your business!
            </div>`;
  const invoiceFooterReplacement = `{/* Footer */}
            <div style={{ backgroundColor: 'rgba(253, 192, 47, 0.15)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
              <div style={{ fontSize: '10px', textAlign: 'left', lineHeight: '1.2' }}>
                <strong>Terms & Condition:</strong><br />
                1. 50% Advance Payment should be paid at the time of Order Placement.<br />
                2. Credit Facility not Available ( Make the Full Payment at the time of delivery ).
              </div>
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#000', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' }}>
                Thank you for your business!
              </div>
            </div>`;
  content = content.replace(invoiceFooterTarget, invoiceFooterReplacement);

  fs.writeFileSync(path, content);
  console.log('Fixed ManageOrders.jsx');
}

function applyTruncation(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Find {item.itemName} and replace it with {item.itemName?.length > 5 ? item.itemName.substring(0, 5) + '...' : item.itemName}
  // Be careful to only replace the ones inside the UI table!
  // In the table, it is rendered as: {item.itemName} inside a <div className="fw-bold text-primary"...
  const target1 = `>
                                {item.itemName}
                              </div>`;
  const replacement1 = `>
                                {item.itemName?.length > 5 ? item.itemName.substring(0, 5) + '...' : item.itemName}
                              </div>`;
  content = content.replace(target1, replacement1);

  const target2 = `>
                            {order.itemName || order.description || '-'}
                          </div>`;
  const replacement2 = `>
                            {(order.itemName || order.description || '-').length > 5 ? (order.itemName || order.description || '-').substring(0, 5) + '...' : (order.itemName || order.description || '-')}
                          </div>`;
  content = content.replace(target2, replacement2);

  fs.writeFileSync(path, content);
  console.log('Truncated item details in', path);
}

fixManageOrders();
applyTruncation('frontend/src/pages/ManageOrders.jsx');
applyTruncation('frontend/src/pages/ClientOrders.jsx');
applyTruncation('frontend/src/pages/EmployeeDashboard.jsx');
