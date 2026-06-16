const multer = require('multer');
const path = require('path');
const fs = require('fs');

// अपलोड फ़ोल्डर सुनिश्चित करें
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// स्टोरेज कॉन्फ़िगरेशन
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // फ़ाइलें कहाँ सहेजनी हैं
  },
  filename: function (req, file, cb) {
    // अद्वितीय फ़ाइल नाम बनाने के लिए टाइमस्टैम्प का उपयोग करें
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// फ़ाइल प्रकार फ़िल्टर
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('❌ केवल JPEG और PNG फ़ाइलें अपलोड की जा सकती हैं।'), false);
  }
};

// Multer मिडिलवेयर बनाएँ
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB फ़ाइल आकार सीमा
  }
});

// HoF और सदस्यों के लिए अपलोड फ़ील्ड्स निर्दिष्ट करें
const hofUploadFields = upload.fields([
  { name: 'headProfilePhoto', maxCount: 1 },
  { name: 'headAadharFront', maxCount: 1 },
  { name: 'headAadharBack', maxCount: 1 }
]);

const memberUploadFields = upload.fields([
  { name: 'memberAadharFront', maxCount: 1 },
  { name: 'memberAadharBack', maxCount: 1 }
]);

module.exports = { hofUploadFields, memberUploadFields };