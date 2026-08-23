const fs = require('fs');

const employeePath = 'frontend/src/pages/EmployeeDashboard.jsx';
let content = fs.readFileSync(employeePath, 'utf8');

// Add missing imports if they don't exist
if (!content.includes("import html2canvas from 'html2canvas';")) {
  content = content.replace("import Swal from 'sweetalert2';", "import Swal from 'sweetalert2';\nimport html2canvas from 'html2canvas';\nimport logoImg from '../assets/Sapp Logo.jpg.jpeg';");
}

// Add state variables if they don't exist
if (!content.includes('const [downloadInvoice, setDownloadInvoice]')) {
  content = content.replace("const [showSuggestions, setShowSuggestions] = useState(false);", "const [showSuggestions, setShowSuggestions] = useState(false);\n  const [downloadInvoice, setDownloadInvoice] = useState(null);\n  const invoiceRef = useRef(null);");
}

fs.writeFileSync(employeePath, content);
console.log('Successfully added missing state and imports');
