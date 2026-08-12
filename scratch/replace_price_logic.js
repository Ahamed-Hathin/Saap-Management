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
    console.log(`File not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Logic replacements
  content = content.replace(/\(Number\(it\.totalQty\) \* Number\(it\.pricePerQty\)\)/g, 'Number(it.pricePerQty)');
  content = content.replace(/\(\(item\.totalQty \|\| 1\) \* \(item\.pricePerQty \|\| 0\)\)/g, '(item.pricePerQty || 0)');
  content = content.replace(/\(\(item\.totalQty \|\| 1\) \* \(item\.price \|\| 0\)\)/g, '(item.price || 0)');
  content = content.replace(/\(e\.target\.value \* editForm\.pricePerQty\)/g, 'editForm.pricePerQty');
  content = content.replace(/\(editForm\.totalQty \* e\.target\.value\)/g, 'e.target.value');
  content = content.replace(/\(e\.target\.value \* formData\.pricePerQty\)/g, 'formData.pricePerQty');
  content = content.replace(/\(formData\.totalQty \* e\.target\.value\)/g, 'e.target.value');


  // Form label replacements
  content = content.replace(/Price\/Qty/g, 'Price');
  content = content.replace(/Price Per Qty/g, 'Price');
  content = content.replace(/PRICE\/QTY/g, 'PRICE');
  content = content.replace(/'RATE'/g, "'PRICE'"); // Invoice header

  // UI rendering replacements
  content = content.replace(/\{item\.totalQty\} x ₹\{item\.pricePerQty\}/g, 'Qty: {item.totalQty} | ₹{item.pricePerQty}');
  content = content.replace(/\{order\.totalQty \|\| 1\} x ₹\{order\.pricePerQty \|\| 0\}/g, 'Qty: {order.totalQty || 1} | ₹{order.pricePerQty || 0}');
  content = content.replace(/\{item\.totalQty\}x\{item\.pricePerQty\}/g, 'Qty: ${item.totalQty} | ₹${item.pricePerQty}');
  
  // Actually rename property
  content = content.replace(/pricePerQty/g, 'price');
  
  // Specifically fix up the CSV map
  content = content.replace(/x\$\{i\.price\}/g, ' | ₹${i.price}');
  
  // Specific fix for "1 x ₹" if any leftover
  content = content.replace(/\{item\.totalQty\} x ₹/g, 'Qty: {item.totalQty} | ₹');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
