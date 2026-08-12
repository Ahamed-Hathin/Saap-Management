const fs = require('fs');
const path = require('path');

const fixClientOrderLogic = () => {
  // 1. Order Model
  const orderModelPath = path.join(__dirname, '..', 'backend/models/Order.js');
  let orderContent = fs.readFileSync(orderModelPath, 'utf8');
  if (!orderContent.includes('isClientOrder:')) {
    orderContent = orderContent.replace(
      /items: \[[\s\S]*?\],/,
      (match) => match + `\n  isClientOrder: {\n    type: Boolean,\n    default: false\n  },`
    );
    fs.writeFileSync(orderModelPath, orderContent, 'utf8');
  }

  // 2. Order Controller
  const orderControllerPath = path.join(__dirname, '..', 'backend/controllers/orderController.js');
  let orderCtrl = fs.readFileSync(orderControllerPath, 'utf8');
  if (!orderCtrl.includes('isClientOrder')) {
    orderCtrl = orderCtrl.replace(/pricePerQty,\n\s*items,/, 'pricePerQty,\n      items,\n      isClientOrder,');
    orderCtrl = orderCtrl.replace(/items: Array\.isArray\(items\) \? items : \[\],/, 'items: Array.isArray(items) ? items : [],\n      isClientOrder: isClientOrder || false,');
    fs.writeFileSync(orderControllerPath, orderCtrl, 'utf8');
  }

  // 3. ManageOrders.jsx
  const manageOrdersPath = path.join(__dirname, '..', 'frontend/src/pages/ManageOrders.jsx');
  let manageOrders = fs.readFileSync(manageOrdersPath, 'utf8');
  
  // Add to formData
  if (!manageOrders.includes('isClientOrder:')) {
    manageOrders = manageOrders.replace(
      /printingCompany: '',\n\s*items:/g,
      "printingCompany: '',\n    isClientOrder: false,\n    items:"
    );
    manageOrders = manageOrders.replace(
      /printingCompany: '', items:/g,
      "printingCompany: '', isClientOrder: false, items:"
    );
  }
  
  // Update suggestion click
  manageOrders = manageOrders.replace(
    /setFormData\(\{ \.\.\.formData, clientName: client\.clientName, mobileNumber: client\.mobileNumber \}\);/g,
    `setFormData({ ...formData, clientName: client.clientName, mobileNumber: client.mobileNumber, isClientOrder: true });`
  );
  
  // Reset isClientOrder if they manually change the name
  manageOrders = manageOrders.replace(
    /setFormData\(\{ \.\.\.formData, clientName: val \? val\.replace\(\/\(\^\\w\|\\s\\w\)\/g, m => m\.toUpperCase\(\)\) : '' \}\);/g,
    `setFormData({ ...formData, clientName: val ? val.replace(/(^\\w|\\s\\w)/g, m => m.toUpperCase()) : '', isClientOrder: false });`
  );

  // Send isClientOrder in submit (already spread via ...formData)
  
  fs.writeFileSync(manageOrdersPath, manageOrders, 'utf8');

  // 4. ClientOrders.jsx
  const clientOrdersPath = path.join(__dirname, '..', 'frontend/src/pages/ClientOrders.jsx');
  let clientOrders = fs.readFileSync(clientOrdersPath, 'utf8');
  
  const oldFilter = /const clientOrdersList = orders\.filter\(order => \{\n\s*const orderPhoneRaw = \(order\.mobileNumber \|\| ''\)\.replace\(\/\\D\/g, ''\);\n\s*return permanentClientPhones\.has\(orderPhoneRaw\);\n\s*\}\);/;
  const newFilter = `const clientOrdersList = orders.filter(order => {
    if (order.isClientOrder === true) return true;
    if (order.isClientOrder === false) return false;
    // Backwards compatibility for old orders
    const orderPhoneRaw = (order.mobileNumber || '').replace(/\\D/g, '');
    return permanentClientPhones.has(orderPhoneRaw);
  });`;
  
  clientOrders = clientOrders.replace(oldFilter, newFilter);
  fs.writeFileSync(clientOrdersPath, clientOrders, 'utf8');
};

fixClientOrderLogic();
console.log("Fixed Client Order Logic");
