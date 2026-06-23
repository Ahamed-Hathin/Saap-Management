require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

fs.writeFileSync('dummy.jpg', 'fake image content');

cloudinary.uploader.upload('dummy.jpg', { folder: 'saap_orders' })
  .then(result => {
    console.log('Upload success:', result);
  })
  .catch(error => {
    console.error('Upload error details:', JSON.stringify(error, null, 2));
  });
