const fs = require('fs');
const path = require('path');

const manageOrdersPath = path.join(__dirname, '../frontend/src/pages/ManageOrders.jsx');
const employeeDashboardPath = path.join(__dirname, '../frontend/src/pages/EmployeeDashboard.jsx');

let manageContent = fs.readFileSync(manageOrdersPath, 'utf8');
let employeeContent = fs.readFileSync(employeeDashboardPath, 'utf8');

// 1. Extract handleDownloadPDF from ManageOrders
const startFn = manageContent.indexOf('const handleDownloadPDF = async (order, index) => {');
const endFnStr = '    }, 500);\n  };';
const endFn = manageContent.indexOf(endFnStr, startFn) + endFnStr.length;
if (startFn === -1 || endFn === -1) {
  console.error("Could not find handleDownloadPDF in ManageOrders.jsx");
  process.exit(1);
}
const newHandleDownload = manageContent.slice(startFn, endFn);

// 2. Extract the Hidden Download Container from ManageOrders
const hiddenContainerStart = manageContent.indexOf('{/* Hidden Download Container */}');
const hiddenContainerEndStr = '</div>\n        </div>\n      )}';
const hiddenContainerEnd = manageContent.indexOf(hiddenContainerEndStr, hiddenContainerStart) + hiddenContainerEndStr.length;
if (hiddenContainerStart === -1 || hiddenContainerEnd === -1) {
    console.error("Could not find Hidden Download Container in ManageOrders.jsx");
    process.exit(1);
}
const hiddenContainer = manageContent.slice(hiddenContainerStart, hiddenContainerEnd);

// 3. Update EmployeeDashboard imports
if (!employeeContent.includes('useRef')) {
  employeeContent = employeeContent.replace(/import React, \{ useState, useEffect, useContext \} from 'react';/, "import React, { useState, useEffect, useContext, useRef } from 'react';");
}
if (!employeeContent.includes("import html2canvas from 'html2canvas';")) {
  employeeContent = employeeContent.replace(/(import .* from '.*';\n)(?!import)/, "$1import html2canvas from 'html2canvas';\nimport logoImg from '../assets/Sapp Logo.jpg.jpeg';\n");
}

// 4. Update EmployeeDashboard state variables
if (!employeeContent.includes('const [downloadInvoice, setDownloadInvoice]')) {
  employeeContent = employeeContent.replace(/(const \[showImageModal, setShowImageModal\] = useState\(false\);)/, "$1\n  const [downloadInvoice, setDownloadInvoice] = useState(null);\n  const invoiceRef = useRef(null);");
}

// 5. Replace handleDownloadPDF in EmployeeDashboard
const oldStartFn = employeeContent.indexOf('const handleDownloadPDF = async (order, index) => {');
const oldEndFnStr1 = 'pdfWidth, pdfHeight);\n    doc.save(`Invoice_${order.serialNumber || \'Order\'}.pdf`);\n  };';
const oldEndFnStr2 = 'doc.save(`Invoice_${order.serialNumber || \'Order\'}.pdf`);\n  };';
const oldEndFnStr3 = 'doc.save'; // Let's just find doc.save
const oldSaveIdx = employeeContent.indexOf('doc.save', oldStartFn);
const oldEndIdx = employeeContent.indexOf('};', oldSaveIdx) + 2;
if (oldStartFn !== -1 && oldSaveIdx !== -1 && oldEndIdx !== -1) {
  const oldHandleDownload = employeeContent.slice(oldStartFn, oldEndIdx);
  employeeContent = employeeContent.replace(oldHandleDownload, newHandleDownload);
} else {
    console.error("Could not find old handleDownloadPDF in EmployeeDashboard.jsx");
    process.exit(1);
}

// 6. Inject the Hidden Download Container into EmployeeDashboard
if (!employeeContent.includes('{/* Hidden Download Container */}')) {
  employeeContent = employeeContent.replace(/(<\/Layout>)/, "  " + hiddenContainer + "\n    $1");
}

fs.writeFileSync(employeeDashboardPath, employeeContent);
console.log("Successfully updated EmployeeDashboard.jsx");
