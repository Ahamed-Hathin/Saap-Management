const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/ManageOrders.jsx',
  'frontend/src/pages/ClientOrders.jsx',
  'frontend/src/pages/EmployeeDashboard.jsx',
];

const modalString = `
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

for (const relPath of files) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add state
  if (!content.includes('selectedItemDetailsOrder')) {
    content = content.replace(
      /const \[previewImage, setPreviewImage\] = useState\(null\);/,
      `const [previewImage, setPreviewImage] = useState(null);\n  const [selectedItemDetailsOrder, setSelectedItemDetailsOrder] = useState(null);`
    );
  }

  // 2. Add Modal
  if (!content.includes('Item Details Modal')) {
    content = content.replace(
      /\{\/\* Image Preview Modal \*\/\}/g,
      modalString.trim()
    );
  }

  // 3. Update Table Cell
  // We need to match the <td> that renders items.
  const oldTableCellRegex = /\{order\.items && order\.items\.length > 0 \? \([\s\S]*?\) \: \([\s\S]*?<\/>\s*\)\}/;
  
  const newTableCell = `{order.items && order.items.length > 0 ? (
                          <div className="d-flex flex-column gap-1">
                            {order.items.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="fw-bold text-primary" 
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setSelectedItemDetailsOrder(order)}
                              >
                                {item.itemName}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="fw-bold text-primary"
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setSelectedItemDetailsOrder(order)}
                          >
                            {order.itemName || order.description || '-'}
                          </div>
                        )}`;
                        
  content = content.replace(oldTableCellRegex, newTableCell);

  // 4. Update Mobile View
  // We need to match the mobile rendering. It varies slightly, let's look for "<strong>Items:</strong>"
  const oldMobileRegex = /\{order\.items && order\.items\.length > 0 \? \([\s\S]*?\) \: order\.itemName \? \([\s\S]*?\) \: order\.description \? \([\s\S]*?\) \: null\}/;
  
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
                      
  content = content.replace(oldMobileRegex, newMobileCell);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
