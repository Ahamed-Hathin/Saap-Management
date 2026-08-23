const fs = require('fs');
const path = require('path');

const files = [
  '../frontend/src/pages/ManageOrders.jsx',
  '../frontend/src/pages/ClientOrders.jsx',
  '../frontend/src/pages/EmployeeDashboard.jsx'
];

const oldHeader = `{/* Header */}
            <div style={{ fontWeight: 'bold', fontSize: '19px', textAlign: 'center', marginBottom: '5px' }}>INVOICE</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              <img src={logoImg} alt="SAPP Creation Logo" style={{ height: '50px' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '10px' }}>
              <div>No.3/4, Shop No.03, 1st Floor, Alam Tower, Allimal St, Trichy - 8.</div>
              <div>Ph: 0431-4010547, Cell: 88833 72047</div>
            </div>`;

const newHeader = `{/* Header */}
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

const oldFooter = `{/* Footer */}
            <div style={{ fontSize: '10px', marginTop: '10px' }}>
              <strong>Terms & Condition:</strong>
              <div>1. 50% Advance Payment should be paid at the time of Order Placement.</div>
              <div>2. Credit Facility not Available ( Make the Full Payment at the time of delivery ).</div>
            </div>
            
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '15px', fontStyle: 'italic' }}>
              Thank you for your business!
            </div>`;

const newFooter = `{/* Footer */}
            <div style={{ backgroundColor: 'rgba(253, 192, 47, 0.15)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
              <div style={{ fontSize: '10px' }}>
                <strong>Terms & Condition:</strong>
                <div>1. 50% Advance Payment should be paid at the time of Order Placement.</div>
                <div>2. Credit Facility not Available ( Make the Full Payment at the time of delivery ).</div>
              </div>
              
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                Thank you for your business!
              </div>
            </div>`;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(oldHeader)) {
      content = content.replace(oldHeader, newHeader);
    } else {
      console.warn(`Could not find oldHeader in ${file}`);
    }
    
    if (content.includes(oldFooter)) {
      content = content.replace(oldFooter, newFooter);
    } else {
      console.warn(`Could not find oldFooter in ${file}`);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
