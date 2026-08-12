const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/ManageOrders.jsx',
  'frontend/src/pages/ClientOrders.jsx',
  'frontend/src/pages/EmployeeDashboard.jsx',
  'frontend/src/pages/OrderDetails.jsx',
];

for (const relPath of files) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Add fallback to pricePerQty for top-level order object
  content = content.replace(/order\.price /g, '(order.price || order.pricePerQty) ');
  content = content.replace(/order\.price\?/g, '(order.price || order.pricePerQty)?');
  content = content.replace(/downloadInvoice\.price\?/g, '(downloadInvoice.price || downloadInvoice.pricePerQty)?');
  content = content.replace(/downloadInvoice\.price /g, '(downloadInvoice.price || downloadInvoice.pricePerQty) ');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath} fallback`);
}
