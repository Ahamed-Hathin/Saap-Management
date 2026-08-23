const fs = require('fs');

const managePath = 'frontend/src/pages/ManageOrders.jsx';
const employeePath = 'frontend/src/pages/EmployeeDashboard.jsx';

const manageContent = fs.readFileSync(managePath, 'utf8');
let employeeContent = fs.readFileSync(employeePath, 'utf8');

const startStr = '{/* Hidden Download Container */}';
const startIdx = manageContent.indexOf(startStr);
const endIdx = manageContent.indexOf('</Layout>', startIdx);
let hiddenContainer = manageContent.slice(startIdx, endIdx);

// The manageOrders container uses `downloadInvoice` (which EmployeeDashboard now has),
// but ManageOrders formatting uses `downloadInvoice.serialNumber`, etc. 
// This fits the order object.

if (!employeeContent.includes(startStr)) {
  employeeContent = employeeContent.replace('</Layout>', hiddenContainer + '\n    </Layout>');
  fs.writeFileSync(employeePath, employeeContent);
  console.log('Successfully injected container into EmployeeDashboard.jsx');
} else {
  console.log('Already has container');
}
