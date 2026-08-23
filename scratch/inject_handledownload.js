const fs = require('fs');

const path = 'frontend/src/pages/EmployeeDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const functionCode = `  const handleDownloadPDF = async (order, index) => {
    setDownloadInvoice(order);
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      icon: 'info',
      title: 'Invoice generation started...'
    });

    setTimeout(async () => {
      if (invoiceRef.current) {
        try {
          const canvas = await html2canvas(invoiceRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          const image = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = \`Invoice_\${order.serialNumber || 'Order'}_\${(order.clientName || 'Client').replace(/\\s+/g, '_')}.png\`;
          link.href = image;
          link.click();
        } catch (error) {
          console.error("Error generating image:", error);
          Swal.fire('Error', 'Failed to generate invoice image', 'error');
        } finally {
          setDownloadInvoice(null);
        }
      } else {
        setDownloadInvoice(null);
      }
    }, 500);
  };
`;

const anchor = "const statusOptions = settings?.orderStatuses || ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'];";

if (!content.includes('const handleDownloadPDF =')) {
  content = content.replace(anchor, functionCode + '\n  ' + anchor);
  fs.writeFileSync(path, content);
  console.log('Added handleDownloadPDF');
} else {
  console.log('Already exists');
}
