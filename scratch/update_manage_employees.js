const fs = require('fs');

const path = 'frontend/src/pages/ManageEmployees.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update formData state
content = content.replace(
  "const [formData, setFormData] = useState({ id: '', name: '', username: '', password: '' });",
  "const [formData, setFormData] = useState({ id: '', name: '', username: '', password: '', accessiblePages: [] });"
);

// Add availablePages and handlePageToggle
if (!content.includes("const availablePages =")) {
  const toggleCode = `  const availablePages = ['Orders', 'Tasks', 'Clients', 'Quotation', 'Settings', 'Time Tracking', 'Other Employees'];

  const handlePageToggle = (page) => {
    setFormData(prev => {
      const isSelected = prev.accessiblePages.includes(page);
      if (isSelected) {
        return { ...prev, accessiblePages: prev.accessiblePages.filter(p => p !== page) };
      } else {
        return { ...prev, accessiblePages: [...prev.accessiblePages, page] };
      }
    });
  };

  const handleShow =`;
  content = content.replace("  const handleShow =", toggleCode);
}

// Update handleShow
content = content.replace(
  "setFormData({ id: '', name: '', username: '', password: '' });",
  "setFormData({ id: '', name: '', username: '', password: '', accessiblePages: ['Orders', 'Tasks', 'Clients', 'Quotation', 'Settings', 'Time Tracking', 'Other Employees'] });"
);

// Update handleEdit
content = content.replace(
  "setFormData({ id: emp._id, name: emp.name, username: emp.username, password: '' });",
  "setFormData({ id: emp._id, name: emp.name, username: emp.username, password: '', accessiblePages: emp.accessiblePages || ['Orders', 'Tasks', 'Clients', 'Quotation', 'Settings', 'Time Tracking', 'Other Employees'] });"
);

// Update handleSubmit PUT
const putTarget = `await api.put(\`/users/\${formData.id}\`, {
          name: formData.name,
          username: formData.username,
          password: formData.password || undefined
        });`;
const putReplacement = `await api.put(\`/users/\${formData.id}\`, {
          name: formData.name,
          username: formData.username,
          password: formData.password || undefined,
          accessiblePages: formData.accessiblePages
        });`;
content = content.replace(putTarget, putReplacement);

// Add UI in Modal
const modalTarget = `            </Form.Group>
          </Modal.Body>`;
const modalReplacement = `            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Access Control (Allowed Pages)</Form.Label>
              <div className="border rounded p-3 bg-light d-flex flex-wrap gap-3">
                {availablePages.map(page => (
                  <Form.Check 
                    key={page}
                    type="switch"
                    id={\`page-switch-\${page.replace(/\\s+/g, '-')}\`}
                    label={page}
                    checked={formData.accessiblePages.includes(page)}
                    onChange={() => handlePageToggle(page)}
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>`;
if (!content.includes('Access Control (Allowed Pages)')) {
  content = content.replace(modalTarget, modalReplacement);
}

fs.writeFileSync(path, content);
console.log('Successfully updated ManageEmployees.jsx');
