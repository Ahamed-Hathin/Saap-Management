const fs = require('fs');
const path = require('path');

const applyPatches = (filePath, isEmployeeDashboard = false) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Modal State
  if (!content.includes('selectedItemDetailsOrder')) {
    content = content.replace(
      /const \[previewImage, setPreviewImage\] = useState\(null\);/,
      `const [previewImage, setPreviewImage] = useState(null);\n  const [selectedItemDetailsOrder, setSelectedItemDetailsOrder] = useState(null);`
    );
  }

  // 2. Initial State `description: ''` -> `items: [{ itemName: '', totalQty: 1, price: 0 }]`
  content = content.replace(/description: ''/g, "items: [{ itemName: '', totalQty: 1, price: 0 }]");

  // 3. handleSubmit logic
  // Replace: advanceAmount: formData.advanceAmount === '' ? 0 : Number(formData.advanceAmount),
  // With items mapping
  if (!content.includes('items: formData.items.map')) {
    content = content.replace(
      /advanceAmount: formData\.advanceAmount === '' \? 0 : Number\(formData\.advanceAmount\),/g,
      `items: formData.items.map(item => ({\n          itemName: item.itemName,\n          totalQty: Number(item.totalQty),\n          price: Number(item.price)\n        })),\n        advanceAmount: formData.advanceAmount === '' ? 0 : Number(formData.advanceAmount),`
    );
  }

  // 4. Modal Item Inputs (replacing description input)
  const descriptionInputRegex = /<div className="col-12">\s*<Form\.Label>Description \(Optional\)<\/Form\.Label>\s*<Form\.Control as="textarea" rows=\{3\} value=\{formData\.description\}.*?className="bg-light" \/>\s*<\/div>/;
  const itemInputs = `
              <div className="col-12 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Order Items</h6>
                  <Button variant="outline-primary" size="sm" onClick={() => setFormData({ ...formData, items: [...formData.items, { itemName: '', totalQty: 1, price: 0 }] })}>
                    <Plus size={16} className="me-1" /> Add Item
                  </Button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded p-3 mb-3 bg-white position-relative">
                    {formData.items.length > 1 && (
                      <Button variant="link" className="position-absolute text-danger p-0" style={{ top: '10px', right: '10px' }} onClick={() => {
                        const newItems = formData.items.filter((_, i) => i !== index);
                        const newTotal = newItems.reduce((sum, it) => sum + Number(it.price), 0);
                        setFormData({ ...formData, items: newItems, totalAmount: newTotal.toString() });
                      }}>
                        <Trash2 size={18} />
                      </Button>
                    )}
                    <div className="row g-3">
                      <div className="col-12">
                        <Form.Label>Item Name</Form.Label>
                        <Form.Control type="text" required value={item.itemName} onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].itemName = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }} className="bg-light" />
                      </div>
                      <div className="col-md-6">
                        <Form.Label>Qty</Form.Label>
                        <Form.Control type="number" required value={item.totalQty} onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].totalQty = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }} className="bg-light" />
                      </div>
                      <div className="col-md-6">
                        <Form.Label>Price</Form.Label>
                        <Form.Control type="number" required value={item.price} onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].price = e.target.value;
                          const newTotal = newItems.reduce((sum, it) => sum + Number(it.price), 0);
                          setFormData({ ...formData, items: newItems, totalAmount: newTotal.toString() });
                        }} className="bg-light" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>`;
  content = content.replace(descriptionInputRegex, itemInputs);

  // 5. Table Cell
  const tableCellRegex = /<td\s*style=\{\{ cursor: order\.description[\s\S]*?<\/td>/;
  const newTableCell = `<td>
                        {order.items && order.items.length > 0 ? (
                          <div className="d-flex flex-column gap-1">
                            {order.items.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="fw-bold text-primary" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedItemDetailsOrder(order)}
                              >
                                {item.itemName}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="fw-bold text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedItemDetailsOrder(order)}
                          >
                            {order.itemName || order.description || '-'}
                          </div>
                        )}
                      </td>`;
  content = content.replace(tableCellRegex, newTableCell);
  content = content.replace(/<th>Description<\/th>/, '<th>Item Details</th>');

  // 6. Mobile View
  const mobileRegex = /\{order\.description && \([\s\S]*?<\/div>` \}\)}>[\s\S]*?<\/span><br \/><\/>\s*\)}/;
  const newMobileCell = `{order.items && order.items.length > 0 ? (
                        <div className="mb-2">
                          <strong>Items:</strong>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {order.items.map((item, idx) => (
                              <span 
                                key={idx} 
                                className="badge bg-light text-primary border"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedItemDetailsOrder(order)}
                              >
                                {item.itemName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <strong>Item:</strong> 
                          <span 
                            className="badge bg-light text-primary border ms-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedItemDetailsOrder(order)}
                          >
                            {order.itemName || order.description || '-'}
                          </span>
                        </div>
                      )}`;
  content = content.replace(mobileRegex, newMobileCell);

  // 7. CSV Export Logic (if applicable)
  if (!isEmployeeDashboard) {
    const csvDescRegex = /const description = escapeCsv\(order\.description \|\| ''\);/g;
    content = content.replace(csvDescRegex, `const description = escapeCsv(order.items?.length > 0 ? order.items.map(i => i.itemName).join(', ') : order.itemName || order.description || '');\n      const priceStr = escapeCsv(order.items?.length > 0 ? '-' : (order.price || order.pricePerQty || 0));`);

    const headerMapRegex = /'TOTAL QTY': order\.totalQty \|\| 1,\n\s*'PRICE\/QTY': order\.pricePerQty \|\| 0,/g;
    content = content.replace(headerMapRegex, `'TOTAL QTY': order.items?.length > 0 ? order.items.reduce((s,i) => s + Number(i.totalQty), 0) : order.totalQty || 1,\n      'PRICE': priceStr,`);
    
    // Also CSV headers
    content = content.replace(/'PRICE\/QTY',/, "'PRICE',");
  }

  // 8. PDF autoTable (if EmployeeDashboard)
  if (isEmployeeDashboard) {
    const autoTableDataRegex = /let itemDesc = order\.itemName \|\| order\.cardType \|\| '-';[\s\S]*?body: \[\n\s*\['1', itemDesc, order\.totalQty \|\| 1, `Rs\. \$\{order\.pricePerQty\?\.toFixed\(2\) \|\| '0\.00'\}`/g;
    const newAutoTableData = `let tableBody = [];
    if (order.items && order.items.length > 0) {
      tableBody = order.items.map((item, index) => [
        (index + 1).toString(),
        item.itemName,
        item.totalQty || 1,
        \`Rs. \${item.price?.toFixed(2) || '0.00'}\`,
        \`Rs. \${(item.price || 0).toFixed(2)}\`
      ]);
    } else {
      let itemDesc = order.itemName || order.cardType || '-';
      if (!order.itemName && order.description) {
        itemDesc += \`\\n\\n\${order.description}\`;
      }
      tableBody = [
        ['1', itemDesc, order.totalQty || 1, \`Rs. \${(order.price || order.pricePerQty)?.toFixed(2) || '0.00'}\`, \`Rs. \${order.totalAmount || 0}\`]
      ];
    }
    
    autoTable(doc, {
      startY: Math.max(95, leftY + 10),
      head: [['SL.', 'Item Description', 'Qty', 'PRICE', 'Total']],
      body: tableBody`;
      
    content = content.replace(/let itemDesc = order\.itemName[\s\S]*?body: \[\n\s*\['1', itemDesc, order\.totalQty \|\| 1, `Rs\. \$\{order\.pricePerQty\?\.toFixed\(2\) \|\| '0\.00'\}`/g, newAutoTableData.substring(0, newAutoTableData.length - 20) + "Wait I need to do this carefully..."); // Will handle autoTable via another regex just in case.

    // Better Regex for autoTable
    const betterAutoTableRegex = /let itemDesc = order\.itemName \|\| order\.cardType \|\| '-';\s*if \(\!order\.itemName && order\.description\) \{\s*itemDesc \+= `\\n\\n\$\{order\.description\}`;\s*\}\s*autoTable\(doc, \{\s*startY: Math\.max\(95, leftY \+ 10\),\s*head: \[\['SL\.', 'Item Description', 'Qty', 'Rate', 'Total'\]\],\s*body: \[\s*\['1', itemDesc, order\.totalQty \|\| 1, `Rs\. \$\{order\.pricePerQty\?\.toFixed\(2\) \|\| '0\.00'\}`, `Rs\. \$\{order\.totalAmount \|\| 0\}`\]\s*\],/g;
    content = content.replace(betterAutoTableRegex, `let tableBody = [];
    if (order.items && order.items.length > 0) {
      tableBody = order.items.map((item, index) => [
        (index + 1).toString(),
        item.itemName,
        item.totalQty || 1,
        \`Rs. \${item.price?.toFixed(2) || '0.00'}\`,
        \`Rs. \${(item.price || 0).toFixed(2)}\`
      ]);
    } else {
      let itemDesc = order.itemName || order.cardType || '-';
      if (!order.itemName && order.description) {
        itemDesc += \`\\n\\n\${order.description}\`;
      }
      tableBody = [
        ['1', itemDesc, order.totalQty || 1, \`Rs. \${(order.price || order.pricePerQty)?.toFixed(2) || '0.00'}\`, \`Rs. \${order.totalAmount || 0}\`]
      ];
    }
    
    autoTable(doc, {
      startY: Math.max(95, leftY + 10),
      head: [['SL.', 'Item Description', 'Qty', 'PRICE', 'Total']],
      body: tableBody,`);
  }

  // 9. Add Modal UI
  const modalUI = `
      {/* Item Details Modal */}
      <Modal backdrop="static" show={!!selectedItemDetailsOrder} onHide={() => setSelectedItemDetailsOrder(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">Item Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-4 pb-4">
          {selectedItemDetailsOrder && (
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item Name</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemDetailsOrder.items && selectedItemDetailsOrder.items.length > 0 ? (
                    selectedItemDetailsOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-medium">{item.itemName}</td>
                        <td className="text-center">{item.totalQty}</td>
                        <td className="text-end">₹{item.price}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="fw-medium">{selectedItemDetailsOrder.itemName || selectedItemDetailsOrder.description || '-'}</td>
                      <td className="text-center">{selectedItemDetailsOrder.totalQty || 1}</td>
                      <td className="text-end">₹{(selectedItemDetailsOrder.price || selectedItemDetailsOrder.pricePerQty) || 0}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Image Preview Modal */}
`;

  if (!content.includes('Item Details Modal')) {
    content = content.replace(
      /\{\/\* Image Preview Modal \*\/\}/g,
      modalUI.trim()
    );
  }
  
  // Custom Invoice generation in ManageOrders/ClientOrders
  if (!isEmployeeDashboard) {
    const customInvoiceRegex = /<div style=\{\{ display: 'flex', fontSize: '15px' \}\}>\s*<div style=\{\{ flex: 0\.5, textAlign: 'center' \}\}>1<\/div>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    
    if (content.match(customInvoiceRegex)) {
      const newInvoiceHTML = `{downloadInvoice.items && downloadInvoice.items.length > 0 ? (
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
                <div style={{ flex: 2 }}>
                  {downloadInvoice.itemName || downloadInvoice.cardType || '-'}
                  {!downloadInvoice.itemName && downloadInvoice.description && (
                    <div style={{ marginTop: '5px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{downloadInvoice.description}</div>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>{downloadInvoice.totalQty || 1}</div>
                <div style={{ flex: 1, textAlign: 'center' }}>{(downloadInvoice.price || downloadInvoice.pricePerQty)?.toFixed(2) || '0.00'}</div>
                <div style={{ flex: 1.2, textAlign: 'right' }}>{(downloadInvoice.totalAmount || 0).toFixed(2)}</div>
              </div>
            )}`;
      content = content.replace(customInvoiceRegex, newInvoiceHTML + '\n          </div>');
      content = content.replace(/'RATE'/g, "'PRICE'");
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'frontend/src/pages/ManageOrders.jsx',
  'frontend/src/pages/ClientOrders.jsx'
];
files.forEach(f => {
  console.log('Patching ' + f);
  applyPatches(path.join(__dirname, '..', f), false);
});

console.log('Patching EmployeeDashboard.jsx');
applyPatches(path.join(__dirname, '..', 'frontend/src/pages/EmployeeDashboard.jsx'), true);

console.log('Done!');
