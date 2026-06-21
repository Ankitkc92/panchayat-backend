const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// आपकी Cloudinary डिटेल्स (जो आपने दी थीं)
cloudinary.config({
  cloud_name: 'dtvbzzffd',
  api_key: '129621385392687',
  api_secret: 'EupLBQ93QGrhorHZXLuIfB9OP-M'
});

// स्टोरेज सेटिंग
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'SmartAhiraura_Profiles', // इस नाम से फोल्डर बनेगा
    allowedFormats: ['jpeg', 'png', 'jpg'], 
  },
});

const upload = multer({ storage: storage });

module.exports = upload;