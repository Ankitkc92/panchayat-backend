require('dotenv').config(); // 🟢 सबसे ज़रूरी: .env फाइल को पढ़ने के लिए
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// 🔔 Expo Push Notification सेटअप
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

// ☁️ Cloudinary के जरूरी पैकेजेस को शामिल किया गया
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// 🟢 CORS सेटिंग (अपडेटेड)
const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:5173", 
    "http://localhost:5000",
    "https://admin-panel-wqzg.onrender.com", 
    "https://citizen-portal-bsl7.onrender.com", 
    "https://ahiraura-website.onrender.com" // (यहाँ अपनी लाइव वेबसाइट का सही लिंक रखें)
  ],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// 📁 Uploads फोल्डर चेक (पुरानी सेटिंग सुरक्षित रखी गई है ताकि कोई एरर न आए)
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// ☁️ 🛠️ Cloudinary क्रेडेंशियल्स कॉन्फ़िगरेशन
cloudinary.config({
  cloud_name: 'dtvbzzffd',
  api_key: '129621385392687',
  api_secret: 'EupLBQ93QGrhorHZXLuIfB9OP-M'
});

// ☁️ 📦 Multer के लिए Cloudinary का ऑनलाइन स्टोरेज इंजन सेट किया गया
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'SmartAhiraura_Uploads', // आपके क्लाउड पर इस नाम का फोल्डर बनेगा
    allowedFormats: ['jpeg', 'png', 'jpg'], // सिर्फ सुरक्षित इमेज फॉर्मेट्स की अनुमति
  },
});
const upload = multer({ storage: storage });

// 🟢 MongoDB कनेक्शन (सुरक्षित तरीके से .env फाइल के साथ)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ डेटाबेस (MongoDB Atlas) सफलतापूर्वक ऑनलाइन कनेक्ट हो गया!"))
  .catch((err) => console.log("❌ डेटाबेस कनेक्शन एरर:", err));  

// 🟢 वित्तीय वर्ष (Financial Year) निकालने के लिए सहायक फंक्शन
const getFinancialYearString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
};

// ==========================================
// 🏢 Schema: स्टाफ और रोल्स (Staff Management)
// ==========================================
const StaffSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true }, // Admin, Pradhan, Sachiv, Sahayak
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});
const Staff = mongoose.model('Staff', StaffSchema);

// 🟢 मास्टर एडमिन का डिफ़ॉल्ट अकाउंट बनाना
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Staff.findOne({ username: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('panchayat@123', salt);
      await Staff.create({ 
        username: 'admin', 
        password: hashedPassword, 
        name: 'मास्टर एडमिन', 
        role: 'Admin' 
      });
      console.log("✅ सुरक्षित मास्टर एडमिन अकाउंट बन गया!");
    }
  } catch (error) { console.log("Admin Error:", error); }
};

// ==========================================
// 1️⃣ Schema: सिटीजन पोर्टल (नागरिकों के लिए)
// ==========================================
const CitizenSchema = new mongoose.Schema({
  familyId: String, 
  fullName: String, 
  fatherName: String, 
  gender: String, 
  aadhaarNo: String, 
  mobile: { type: String, unique: true, required: true }, 
  password: { type: String, required: true },
  profilePicPath: String, 
  aadhaarPicPath: String,
  pushToken: { type: String, default: '' }, 
  status: { type: String, default: 'Pending' }, 
  createdAt: { type: Date, default: Date.now }
});
const Citizen = mongoose.model('Citizen', CitizenSchema);

// ==========================================
// 2️⃣ Schema: एडमिन पोर्टल (परिवार रजिस्टर के लिए)
// ==========================================
const FamilySchema = new mongoose.Schema({
  villageName: String, parganaPanchayat: String, vikasKhand: String, tehsil: String, district: String,
  familyId: String, headName: String, houseNo: String, majra: String, mobile: String,
  pitapatiKaNam: String, dharmAnusuchitJatiKiDashaMeJati: String, vyavasay: String,
  purushYaStri: String, janmaTithiYadiJnatHoAthwaSambhashyaJanmaTithi: String,
  saksharNiraksharAakarHoneKiDashaMeAhetaAurByoreSahit: String,
  sanketChodDeneYaMrityuKaDinaank: String, abhiyuktiyanVivaran: String,
  headProfilePhotoPath: String, headAadharFrontPath: String, headAadharBackPath: String,
  members: Array,
  status: { type: String, default: 'Approved' },
  createdAt: { type: Date, default: Date.now }
});
const Family = mongoose.model('Family', FamilySchema);

// ==========================================
// 3️⃣ Schema: शिकायत प्रबंधन (Complaint System)
// ==========================================
const ComplaintSchema = new mongoose.Schema({
  complaintId: String,      
  familyId: String,         
  citizenName: String,      
  mobile: String,           
  complaintType: String,    
  description: String,      
  photoPath: String,        
  photoPaths: { type: [String], default: [] }, 
  locationCoords: String,   
  status: { type: String, default: 'Pending' }, 
  adminRemarks: { type: String, default: '' },  
  createdAt: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('Complaint', ComplaintSchema);

// ==========================================
// 4️⃣ Schema: प्रमाण पत्र प्रबंधन (Certificate System)
// ==========================================
const CertificateSchema = new mongoose.Schema({
  applicationId: String,    
  certificateId: { type: String, default: null }, 
  familyId: String,         
  citizenName: String,      
  mobile: String,           
  certificateType: String,  
  serviceAction: { type: String, default: 'NEW_COPY' }, 
  description: String,      
  applicantAadharPath: String, 
  supportingDocPath: String,   
  memberAadharFrontPath: String, 
  memberAadharBackPath: String,  
  status: { type: String, default: 'Pending' }, 
  adminRemarks: { type: String, default: '' },  
  createdAt: { type: Date, default: Date.now }
});
const Certificate = mongoose.model('Certificate', CertificateSchema);

// ==========================================
// 5️⃣ Schema: प्रोफाइल अपडेट अनुरोध (Profile Update System)
// ==========================================
const ProfileUpdateSchema = new mongoose.Schema({
  requestId: String,        
  familyId: String,         
  citizenName: String,      
  oldData: Object,          
  newData: Object,          
  status: { type: String, default: 'Pending' }, 
  requestDate: { type: Date, default: Date.now }
});
const ProfileUpdate = mongoose.model('ProfileUpdate', ProfileUpdateSchema);

// ==========================================
// 6️⃣ Schema: सूचना पट्ट (Notice Board)
// ==========================================
const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },       
  content: { type: String, required: true },     
  tag: { type: String, default: 'NEW' },         // 🌟 रंगीन टैग
  isActive: { type: Boolean, default: true },    
  createdAt: { type: Date, default: Date.now }
});
const Notice = mongoose.model('Notice', NoticeSchema);

// ==========================================
// 7️⃣ Schema: कर/शुल्क प्रबंधन (Tax Management)
// ==========================================
const TaxSchema = new mongoose.Schema({
  taxId: { type: String, unique: true },
  familyId: String,
  citizenName: String,
  taxType: String,
  amount: Number,
  financialYear: String, 
  status: { type: String, default: 'Pending' }, 
  paymentDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Tax = mongoose.model('Tax', TaxSchema);

// ==========================================
// 8️⃣ Schema: मुख्य होम पेज (CMS Data) 
// ==========================================
const CmsHomeSchema = new mongoose.Schema({
  content: {
    heroData: { title: String, subtitle: String, mediaType: String, mediaSource: String, bgImageUrl: String }, 
    pradhanData: { name: String, message: String },
    statsData: { population: String, wards: String, literacy: String, staff: String },
    notices: Array,
    services: Array,
    testimonials: Array,
    portals: Array
  }
}, { timestamps: true });
const CmsHomeData = mongoose.model('CmsHomeData', CmsHomeSchema);

// ==========================================
// 🌟 8.5 Schema: 'हमारे बारे में' पेज (CMS About Data)
// ==========================================
const CmsAboutSchema = new mongoose.Schema({
  content: { type: Object, default: {} } // 🌟 Flexible Object
}, { timestamps: true });
const CmsAboutData = mongoose.model('CmsAboutData', CmsAboutSchema);

// ==========================================
// 👔 8.6 Schema: 'प्रतिनिधि एवं अधिकारी' पेज (CMS Reps Data)
// ==========================================
const CmsRepsSchema = new mongoose.Schema({
  content: { type: Object, default: {} } // 🌟 Flexible Object 
}, { timestamps: true });
const CmsRepsData = mongoose.model('CmsRepsData', CmsRepsSchema);

// ==========================================
// 🔔 Push Notification भेजने का फंक्शन (Helper)
// ==========================================
const sendPushNotification = async (targetToken, title, messageBody) => {
  if (!targetToken || !Expo.isExpoPushToken(targetToken)) {
    console.log("Valid push token नहीं मिला: ", targetToken);
    return;
  }

  const messages = [{
    to: targetToken,
    sound: 'default',
    title: title,
    body: messageBody,
    data: { withSomeData: 'goes here' },
  }];

  try {
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    console.log("✅ Notification सफलतापूर्वक भेज दिया गया!");
  } catch (error) {
    console.error("Notification भेजने में एरर:", error);
  }
};


// ==========================================
// 🚀 API Routes (सारे रास्ते)
// ==========================================

// 🌟 जेनेरिक फाइल अपलोड API
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "कोई फाइल नहीं मिली" });
    res.status(200).json({ success: true, url: req.file.path }); 
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर" });
  }
});

// ==========================================
// 🏢 स्टाफ प्रबंधन API (STAFF MANAGEMENT) 
// ==========================================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Staff.findOne({ username });
    
    if (user) {
      if (user.status !== 'Active') {
        return res.status(403).json({ message: "❌ आपका अकाउंट सस्पेंड कर दिया गया है।" });
      }
      res.status(200).json({ message: "लॉगिन सफल!", user: { name: user.name, role: user.role, username: user.username } });
    } else {
      res.status(401).json({ message: "❌ गलत यूज़रनेम या पासवर्ड!" });
    }
  } catch (error) { 
    res.status(500).json({ message: "सर्वर एरर" }); 
  }
});

app.get('/api/admin/staff/all', async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json(staff);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में एरर" }); 
  }
});

app.post('/api/admin/staff/add', async (req, res) => {
  try {
    const existing = await Staff.findOne({ username: req.body.username });
    if(existing) {
      return res.status(400).json({ message: "यह यूज़रनेम पहले से मौजूद है। कोई दूसरा नाम चुनें।" });
    }
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res.status(201).json({ message: "नया स्टाफ सफलतापूर्वक बन गया!", data: newStaff });
  } catch (error) { 
    res.status(500).json({ message: "स्टाफ जोड़ने में एरर" }); 
  }
});

app.put('/api/admin/staff/suspend/:id', async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, { status: 'Suspended' }, { new: true });
    res.status(200).json({ message: "अकाउंट सस्पेंड कर दिया गया है。", data: updatedStaff });
  } catch (error) { 
    res.status(500).json({ message: "एरर" }); 
  }
});


// ==========================================
// 🟢 [CITIZEN API] 1. नागरिक पंजीकरण (Registration)
// ==========================================
app.post('/api/register', upload.fields([
  { name: 'profilePic', maxCount: 1 }, 
  { name: 'aadhaarPic', maxCount: 1 }
]), async (req, res) => {
  try {
    const { familyId, fullName, fatherName, gender, aadhaarNo, mobile, password } = req.body;
    const existingUser = await Citizen.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "यह मोबाइल नंबर पहले से रजिस्टर्ड है!" });
    }

    const newCitizen = new Citizen({
      familyId, fullName, fatherName, gender, aadhaarNo, mobile, password,
      profilePicPath: req.files && req.files['profilePic'] ? req.files['profilePic'][0].path : '',
      aadhaarPicPath: req.files && req.files['aadhaarPic'] ? req.files['aadhaarPic'][0].path : ''
    });

    await newCitizen.save();
    res.status(201).json({ message: "पंजीकरण सफलतापूर्वक पूरा हुआ! एडमिन की मंज़ूरी का इंतज़ार करें।" });
  } catch (error) {
    res.status(500).json({ message: "सर्वर एरर: पंजीकरण विफल रहा।" });
  }
});

// ==========================================
// 🟢 [CITIZEN API] 2. नागरिक लॉगिन 
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await Citizen.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "यह मोबाइल नंबर रजिस्टर नहीं है! पहले पंजीकरण करें।" });
    }
    if (user.password !== password) {
      return res.status(400).json({ message: "❌ आपने गलत पासवर्ड डाला है।" });
    }
    if (user.status === 'Pending') {
      return res.status(403).json({ message: "⏳ आपका खाता अभी सत्यापन (Verification) के लिए लंबित है। कृपया एडमिन द्वारा अप्रूव होने का इंतज़ार करें।" });
    }
    if (user.status === 'Rejected') {
      return res.status(403).json({ message: "❌ आपका खाता अस्वीकृत (Rejected) कर दिया गया है। कृपया पंचायत कार्यालय में संपर्क करें।" });
    }
    
    res.status(200).json({ 
      message: "लॉगिन सफल!", 
      user: { 
        fullName: user.fullName, 
        fatherName: user.fatherName, 
        familyId: user.familyId, 
        mobile: user.mobile,
        gender: user.gender, 
        profilePicPath: user.profilePicPath 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "सर्वर एरर" });
  }
});

app.post('/api/citizen/save-token', async (req, res) => {
  try {
    const { mobile, token } = req.body;
    if (mobile && token) {
      await Citizen.updateOne({ mobile: mobile }, { $set: { pushToken: token } });
    }
    res.status(200).json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Token सेव करने में एरर।" });
  }
});

// ==========================================
// 🏛️ [ADMIN API] 3. सभी नागरिकों की लिस्ट मंगाना
// ==========================================
app.get('/api/admin/citizens/all', async (req, res) => {
  try {
    const citizens = await Citizen.find().sort({ createdAt: -1 });
    res.status(200).json(citizens);
  } catch (error) { 
    res.status(500).json({ message: "नागरिकों का डेटा मंगाने में एरर" }); 
  }
});

app.put('/api/admin/citizen/status/:id', async (req, res) => {
  try {
    const updatedCitizen = await Citizen.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );

    if (updatedCitizen && updatedCitizen.pushToken) {
      const msg = req.body.status === 'Approved' 
        ? '🎉 आपका प्रोफाइल अप्रूव हो गया है! अब आप सिटिजन पोर्टल की सभी सेवाओं का लाभ ले सकते हैं।' 
        : '❌ आपका प्रोफाइल रिजेक्ट कर दिया गया है। कृपया पंचायत कार्यालय में संपर्क करें।';
      sendPushNotification(updatedCitizen.pushToken, 'प्रोफाइल स्टेटस अपडेट', msg);
    }
    res.status(200).json({ message: "स्टेटस अपडेट हो गया", data: updatedCitizen });
  } catch (error) { 
    res.status(500).json({ message: "स्टेटस अपडेट करने में एरर" }); 
  }
});

app.put('/api/admin/citizen/update/:id', async (req, res) => {
  try {
    const updatedData = await Citizen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "डेटा अपडेट हो गया", data: updatedData });
  } catch (error) { 
    res.status(500).json({ message: "अपडेट करने में एरर" }); 
  }
});

app.delete('/api/admin/citizen/delete/:id', async (req, res) => {
  try {
    await Citizen.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "नागरिक डिलीट हो गया" });
  } catch (error) { 
    res.status(500).json({ message: "डिलीट करने में एरर" }); 
  }
});

// ==========================================
// 👑 [ADMIN API] 7. परिवार रजिस्टर का पूरा डेटा मंगाना
// ==========================================
app.get('/api/family/all', async (req, res) => {
  try { 
    const families = await Family.find().sort({ createdAt: -1 }); 
    res.status(200).json(families); 
  } catch (error) { 
    res.status(500).json({ message: "परिवार का डेटा मंगाने में त्रुटि" }); 
  }
});

app.post('/api/family/add', upload.fields([
  { name: 'headProfilePhoto', maxCount: 1 }, 
  { name: 'headAadharFront', maxCount: 1 }, 
  { name: 'headAadharBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const newFamily = new Family({ 
      ...req.body, 
      headProfilePhotoPath: req.files && req.files['headProfilePhoto'] ? req.files['headProfilePhoto'][0].path : '', 
      headAadharFrontPath: req.files && req.files['headAadharFront'] ? req.files['headAadharFront'][0].path : '', 
      headAadharBackPath: req.files && req.files['headAadharBack'] ? req.files['headAadharBack'][0].path : '' 
    });
    const savedFamily = await newFamily.save();
    res.status(201).json({ message: "परिवार जुड़ गया", data: savedFamily });
  } catch (error) { 
    res.status(500).json({ message: "परिवार जोड़ने में त्रुटि" }); 
  }
});

// ==========================================
// 🏛️ [ADMIN API] 8.5 परिवार (मुखिया) का डेटा अपडेट करना (🌟 MISSING API RESTORED)
// ==========================================
app.put('/api/family/update/:id', upload.fields([
  { name: 'headProfilePhoto', maxCount: 1 }, 
  { name: 'headAadharFront', maxCount: 1 }, 
  { name: 'headAadharBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.files && req.files['headProfilePhoto']) {
      updateData.headProfilePhotoPath = req.files['headProfilePhoto'][0].path;
    }
    if (req.files && req.files['headAadharFront']) {
      updateData.headAadharFrontPath = req.files['headAadharFront'][0].path;
    }
    if (req.files && req.files['headAadharBack']) {
      updateData.headAadharBackPath = req.files['headAadharBack'][0].path;
    }

    const updatedFamily = await Family.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ message: "परिवार (मुखिया) का डेटा अपडेट हो गया", data: updatedFamily });
  } catch (error) { 
    res.status(500).json({ message: "परिवार अपडेट करने में त्रुटि" }); 
  }
});

app.delete('/api/family/delete/:id', async (req, res) => {
  try { 
    await Family.findByIdAndDelete(req.params.id); 
    res.status(200).json({ message: "परिवार हटा दिया गया" }); 
  } catch (error) { 
    res.status(500).json({ message: "परिवार डिलीट करने में त्रुटि" }); 
  }
});

app.get('/api/family/my-family/:familyId', async (req, res) => {
  try {
    const familyData = await Family.findOne({ familyId: req.params.familyId });
    if (!familyData) {
      return res.status(404).json({ message: "परिवार का रिकॉर्ड नहीं मिला।" });
    }
    res.status(200).json(familyData);
  } catch (error) {
    res.status(500).json({ message: "डेटा प्राप्त करने में त्रुटि" });
  }
});

app.post('/api/family/add-member/:hofId', upload.fields([
  { name: 'memberAadharFront', maxCount: 1 }, 
  { name: 'memberAadharBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const family = await Family.findById(req.params.hofId);
    if (!family) return res.status(404).json({ message: "परिवार नहीं मिला" });

    const newMember = {
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
      aadharFrontPath: req.files && req.files['memberAadharFront'] ? req.files['memberAadharFront'][0].path : '',
      aadharBackPath: req.files && req.files['memberAadharBack'] ? req.files['memberAadharBack'][0].path : ''
    };

    family.members.push(newMember);
    await family.save();
    res.status(200).json({ message: "सदस्य जुड़ गया", data: family });
  } catch (error) {
    res.status(500).json({ message: "सदस्य जोड़ने में त्रुटि" });
  }
});

app.put('/api/family/update-member/:hofId/:memberId', async (req, res) => {
  try {
    const family = await Family.findById(req.params.hofId);
    if (!family) return res.status(404).json({ message: "परिवार नहीं मिला" });

    const memberIndex = family.members.findIndex(m => m._id.toString() === req.params.memberId);
    if (memberIndex === -1) return res.status(404).json({ message: "सदस्य नहीं मिला" });

    family.members[memberIndex] = { ...family.members[memberIndex], ...req.body };
    family.markModified('members'); 
    await family.save();
    res.status(200).json({ message: "सदस्य अपडेट हो गया", data: family });
  } catch (error) {
    res.status(500).json({ message: "सदस्य अपडेट करने में त्रुटि" });
  }
});

app.delete('/api/family/delete-member/:hofId/:memberId', async (req, res) => {
  try {
    const family = await Family.findById(req.params.hofId);
    if (!family) return res.status(404).json({ message: "परिवार नहीं मिला" });

    family.members = family.members.filter(m => m._id.toString() !== req.params.memberId);
    await family.save();
    res.status(200).json({ message: "सदस्य डिलीट हो गया" });
  } catch (error) {
    res.status(500).json({ message: "सदस्य डिलीट करने में त्रुटि" });
  }
});

// ==========================================
// 📢 शिकायत प्रबंधन API (COMPLAINTS)
// ==========================================

app.post('/api/complaint/add', upload.array('complaintPhotos', 5), async (req, res) => {
  try {
    const { familyId, citizenName, mobile, complaintType, description, locationCoords } = req.body;
    const count = await Complaint.countDocuments();
    const complaintId = `CMP-${count + 101}`;
    const uploadedPhotos = req.files ? req.files.map(file => file.path) : [];

    const newComplaint = new Complaint({
      complaintId, familyId, citizenName, mobile, complaintType, description,
      locationCoords: locationCoords || '',         
      photoPaths: uploadedPhotos,                   
      photoPath: uploadedPhotos.length > 0 ? uploadedPhotos[0] : '' 
    });
    
    await newComplaint.save();
    res.status(201).json({ message: `आपकी शिकायत (${complaintId}) सफलतापूर्वक दर्ज हो गई है!` });
  } catch (error) {
    res.status(500).json({ message: "शिकायत दर्ज करने में त्रुटि आई।" });
  }
});

app.get('/api/complaint/my/:familyId', async (req, res) => {
  try {
    const complaints = await Complaint.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) { 
    res.status(500).json({ message: "शिकायतें लाने में त्रुटि।" }); 
  }
});

app.get('/api/admin/complaints/all', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) { 
    res.status(500).json({ message: "शिकायतें लाने में त्रुटि।" }); 
  }
});

app.put('/api/admin/complaint/update/:id', async (req, res) => {
  try {
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status, adminRemarks: req.body.adminRemarks }, 
      { new: true }
    );

    const citizen = await Citizen.findOne({ familyId: updatedComplaint.familyId });
    if (citizen && citizen.pushToken) {
      const msg = `📢 आपकी शिकायत (${updatedComplaint.complaintId}) का स्टेटस अब '${req.body.status}' हो गया है। जवाब: ${req.body.adminRemarks}`;
      sendPushNotification(citizen.pushToken, 'शिकायत समाधान अपडेट', msg);
    }
    res.status(200).json({ message: "शिकायत का स्टेटस अपडेट हो गया।", data: updatedComplaint });
  } catch (error) { 
    res.status(500).json({ message: "अपडेट करने में त्रुटि।" }); 
  }
});

// ==========================================
// 📜 प्रमाण पत्र प्रबंधन API (CERTIFICATES)
// ==========================================

app.post('/api/certificate/apply', upload.fields([
  { name: 'applicantAadhar', maxCount: 1 }, 
  { name: 'supportingDoc', maxCount: 1 },
  { name: 'memberAadharFront', maxCount: 1 }, 
  { name: 'memberAadharBack', maxCount: 1 }  
]), async (req, res) => {
  try {
    const { familyId, citizenName, mobile, certificateType, description, serviceAction } = req.body;
    const fy = getFinancialYearString();
    const prefix = `APP/PR/${fy}/`;
    const count = await Certificate.countDocuments({ applicationId: { $regex: '^' + prefix } });
    const nextSequence = String(count + 1).padStart(4, '0');
    const applicationId = `${prefix}${nextSequence}`;

    const newCertificate = new Certificate({
      applicationId, certificateId: null, familyId, citizenName, mobile, certificateType, serviceAction: serviceAction || 'NEW_COPY', description,
      applicantAadharPath: req.files && req.files['applicantAadhar'] ? req.files['applicantAadhar'][0].path : '',
      supportingDocPath: req.files && req.files['supportingDoc'] ? req.files['supportingDoc'][0].path : '',
      memberAadharFrontPath: req.files && req.files['memberAadharFront'] ? req.files['memberAadharFront'][0].path : '', 
      memberAadharBackPath: req.files && req.files['memberAadharBack'] ? req.files['memberAadharBack'][0].path : ''    
    });
    
    await newCertificate.save();
    res.status(201).json({ message: `आपका ${certificateType} का आवेदन (ID: ${applicationId}) सफलतापूर्वक जमा हो गया है!` });
  } catch (error) {
    res.status(500).json({ message: "आवेदन जमा करने में त्रुटि आई।" });
  }
});

app.get('/api/certificate/my/:familyId', async (req, res) => {
  try {
    const certificates = await Certificate.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" }); 
  }
});

app.get('/api/admin/certificates/all', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" }); 
  }
});

app.put('/api/admin/certificate/update/:id', async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    let updateFields = { status, adminRemarks };

    const currentCert = await Certificate.findById(req.params.id);
    if (!currentCert) return res.status(404).json({ message: "आवेदन नहीं मिला" });

    if (status === 'Approved' && !currentCert.certificateId) {
      const fy = getFinancialYearString();
      const prefix = `CERT/PR/${fy}/`;
      const count = await Certificate.countDocuments({ certificateId: { $regex: '^' + prefix } });
      const nextSequence = String(count + 1).padStart(4, '0');
      updateFields.certificateId = `${prefix}${nextSequence}`;
    }

    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id, updateFields, { new: true }
    );

    if (status === 'Approved' && updatedCertificate.certificateType.includes("परिवार रजिस्टर")) {
      const { familyId, description, serviceAction, memberAadharFrontPath, memberAadharBackPath } = updatedCertificate;
      let parsedData = {};
      try { parsedData = JSON.parse(description); } catch (e) {}

      if (serviceAction === 'ADD_MEMBER') {
        const newMember = {
          _id: new mongoose.Types.ObjectId(),
          memberName: parsedData.memberName || "Unknown",
          pitapatiKaNam: parsedData.pitapatiKaNam || "-",
          purushYaStri: parsedData.purushYaStri || "-",
          janmaTithi: parsedData.janmaTithi ? new Date(parsedData.janmaTithi) : null,
          vyavasay: parsedData.vyavasay || "-",
          dharmAnusuchitJatiKiDashaMeJati: parsedData.dharm || "-",
          saksharNiraksharAakarHoneKiDashaMeAhetaAurByoreSahit: parsedData.sakshar || "-",
          sanketChodDeneYaMrityuKaDinaank: parsedData.dod ? new Date(parsedData.dod) : null,
          hiyuktiyanVivaran: parsedData.abhiyuktiyan || "ऑनलाइन सिटिजन पोर्टल द्वारा स्वीकृत",
          aadharFrontPath: memberAadharFrontPath || '',
          aadharBackPath: memberAadharBackPath || ''
        };
        await Family.updateOne({ familyId: familyId.trim() }, { $push: { members: newMember } });
      } else if (serviceAction === 'REMOVE_MEMBER') {
        const deceasedName = parsedData.deceasedName;
        const dod = parsedData.dod;
        await Family.updateOne(
          { familyId: familyId.trim(), "members.memberName": deceasedName },
          { $set: { "members.$.sanketChodDeneYaMrityuKaDinaank": dod ? new Date(dod).toISOString() : new Date().toISOString(), "members.$.abhiyuktiyanVivaran": "मृत्यु / अन्य कारण से नाम निरस्त" } }
        );
      }
    }

    const citizen = await Citizen.findOne({ familyId: updatedCertificate.familyId });
    if (citizen && citizen.pushToken) {
      const msg = `📜 आपका ${updatedCertificate.certificateType} का आवेदन स्टेटस अब '${status}' हो गया है।`;
      sendPushNotification(citizen.pushToken, 'प्रमाण पत्र अपडेट ✅', msg);
    }
    res.status(200).json({ message: "आवेदन का स्टेटस अपडेट हो गया।", data: updatedCertificate });
  } catch (error) { 
    res.status(500).json({ message: "अपडेट करने में त्रुटि।" }); 
  }
});

app.delete('/api/admin/certificate/delete/:id', async (req, res) => {
  try {
    const deletedCert = await Certificate.findByIdAndDelete(req.params.id);
    if (!deletedCert) return res.status(404).json({ message: "आवेदन नहीं मिला" });
    res.json({ message: "✅ आवेदन सफलतापूर्वक डिलीट कर दिया गया!" });
  } catch (error) {
    res.status(500).json({ message: "सर्वर एरर" });
  }
});

// ==========================================
// 👤 प्रोफाइल अपडेट API (CITIZEN & ADMIN)
// ==========================================

app.post('/api/profile/request-update', async (req, res) => {
  try {
    const { familyId, citizenName, oldData, newData } = req.body;
    const count = await ProfileUpdate.countDocuments();
    const requestId = `REQ-${count + 1001}`;

    const newRequest = new ProfileUpdate({ requestId, familyId, citizenName, oldData, newData });
    await newRequest.save();
    res.status(201).json({ message: "आपकी रिक्वेस्ट दर्ज हो गई है!" });
  } catch (error) {
    res.status(500).json({ message: "रिक्वेस्ट दर्ज करने में त्रुटि आई।" });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { mobile, oldPassword, newPassword } = req.body;
    const user = await Citizen.findOne({ mobile: mobile });
    if (!user) return res.status(404).json({ message: "यूज़र नहीं मिला।" });
    if (user.password !== oldPassword) return res.status(400).json({ message: "पुराना पासवर्ड गलत है।" });
    user.password = newPassword; 
    await user.save();
    res.status(200).json({ message: "पासवर्ड सफलतापूर्वक बदल गया है।" });
  } catch (error) {
    res.status(500).json({ message: "सर्वर एरर" });
  }
});

app.post('/api/profile-update-request', upload.single('profilePic'), async (req, res) => {
  try {
    const { familyId, oldMobile, mobile, fullName, fatherName, gender } = req.body;
    const count = await ProfileUpdate.countDocuments();
    const requestId = `REQ-${count + 1001}`;

    const newRequest = new ProfileUpdate({
      requestId, familyId, citizenName: fullName, oldData: { mobile: oldMobile },
      newData: { mobile, fullName, fatherName, gender, profilePicPath: req.file ? req.file.path : null }
    });
    
    await newRequest.save();
    res.status(200).json({ message: "प्रोफाइल अपडेट का अनुरोध प्राप्त हुआ।" });
  } catch (error) {
    res.status(500).json({ message: "सर्वर एरर" });
  }
});

app.get('/api/admin/profile-requests', async (req, res) => {
  try {
    const requests = await ProfileUpdate.find({ status: 'Pending' }).sort({ requestDate: -1 });
    const formattedRequests = requests.map(req => ({
      id: req.requestId, citizenName: req.citizenName, familyId: req.familyId,
      oldData: req.oldData, newData: req.newData, requestDate: new Date(req.requestDate).toLocaleDateString('en-GB')
    }));
    res.status(200).json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" });
  }
});

app.post('/api/admin/approve-profile/:requestId', async (req, res) => {
  try {
    const request = await ProfileUpdate.findOne({ requestId: req.params.requestId });
    if (!request) return res.status(404).json({ message: "रिक्वेस्ट नहीं मिली!" });

    const citizen = await Citizen.findOne({ familyId: request.familyId, mobile: request.oldData.mobile });
    if (citizen) {
      if (request.newData.mobile) citizen.mobile = request.newData.mobile;
      if (request.newData.fullName) citizen.fullName = request.newData.fullName;
      if (request.newData.fatherName) citizen.fatherName = request.newData.fatherName;
      if (request.newData.gender) citizen.gender = request.newData.gender;
      if (request.newData.profilePicPath) citizen.profilePicPath = request.newData.profilePicPath;
      await citizen.save();
    }

    request.status = 'Approved';
    await request.save();
    res.status(200).json({ message: "प्रोफाइल सफलतापूर्वक अपडेट कर दी गई है!" });
  } catch (error) {
    res.status(500).json({ message: "अप्रूव करने में त्रुटि आई।" });
  }
});

app.post('/api/admin/reject-profile/:requestId', async (req, res) => {
  try {
    const request = await ProfileUpdate.findOne({ requestId: req.params.requestId });
    if (!request) return res.status(404).json({ message: "रिक्वेस्ट नहीं मिली!" });

    request.status = 'Rejected';
    await request.save();
    res.status(200).json({ message: "रिक्वेस्ट रद्द कर दी गई है।" });
  } catch (error) {
    res.status(500).json({ message: "रिजेक्ट करने में त्रुटि।" });
  }
});

// ==========================================
// 📢 सूचना पट्ट (NOTICE BOARD) API 
// ==========================================

app.get('/api/notices/active', async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "सूचना लाने में त्रुटि।" });
  }
});

app.get('/api/admin/notices/all', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "सूचना लाने में त्रुटि।" });
  }
});

app.post('/api/admin/notice/add', async (req, res) => {
  try {
    const newNotice = new Notice({
      title: req.body.title,
      content: req.body.content,
      tag: req.body.tag || 'NEW', // 🌟 नया: टैग सेव करें
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    await newNotice.save();
    res.status(201).json({ message: "सूचना पट्ट पर सफलतापूर्वक जोड़ दी गई!", data: newNotice });
  } catch (error) {
    res.status(500).json({ message: "सूचना जोड़ने में त्रुटि।" });
  }
});

app.put('/api/admin/notice/update/:id', async (req, res) => {
  try {
    const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "सूचना अपडेट कर दी गई!", data: updatedNotice });
  } catch (error) {
    res.status(500).json({ message: "सूचना अपडेट करने में त्रुटि।" });
  }
});

app.delete('/api/admin/notice/delete/:id', async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "सूचना हमेशा के लिए डिलीट कर दी गई।" });
  } catch (error) {
    res.status(500).json({ message: "सूचना डिलीट करने में त्रुटि।" });
  }
});

// ==========================================
// 💰 कर/शुल्क प्रबंधन (TAX MANAGEMENT) API 
// ==========================================

app.get('/api/admin/taxes/all', async (req, res) => {
  try {
    const taxes = await Tax.find().sort({ createdAt: -1 });
    res.status(200).json(taxes);
  } catch (error) {
    res.status(500).json({ message: "टैक्स डेटा लाने में एरर" });
  }
});

app.post('/api/admin/tax/add', async (req, res) => {
  try {
    const count = await Tax.countDocuments();
    const taxId = `FEE-${count + 1001}`; 
    const newTax = new Tax({ taxId, ...req.body });
    await newTax.save();
    res.status(201).json({ message: "बिल सफलतापूर्वक जोड़ दिया गया!", data: newTax });
  } catch (error) {
    res.status(500).json({ message: "बिल जोड़ने में एरर" });
  }
});

app.put('/api/admin/tax/pay/:id', async (req, res) => {
  try {
    const updatedTax = await Tax.findByIdAndUpdate(
      req.params.id, 
      { status: 'Paid', paymentDate: new Date() }, 
      { new: true }
    );
    res.status(200).json({ message: "भुगतान सफलतापूर्वक प्राप्त हुआ!", data: updatedTax });
  } catch (error) {
    res.status(500).json({ message: "अपडेट करने में एरर" });
  }
});

app.delete('/api/admin/tax/delete/:id', async (req, res) => {
  try {
    await Tax.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "रिकॉर्ड हटा दिया गया।" });
  } catch (error) {
    res.status(500).json({ message: "डिलीट करने में एरर" });
  }
});

// ==========================================
// 🌐 CMS / होम पेज API (CMS MANAGEMENT)
// ==========================================

app.post('/api/cms/homepage', async (req, res) => {
  try {
    const newContent = req.body;
    const updatedData = await CmsHomeData.findOneAndUpdate(
      {}, 
      { content: newContent },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "होम पेज का डेटा सफलतापूर्वक लाइव हो गया है!", data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर, डेटा सेव नहीं हुआ।" });
  }
});

app.get('/api/cms/homepage', async (req, res) => {
  try {
    const data = await CmsHomeData.findOne();
    if (data) {
      res.status(200).json({ success: true, content: data.content });
    } else {
      res.status(404).json({ success: false, message: "अभी तक कोई डेटा सेव किया गया है।" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर।" });
  }
});

// ==========================================
// 🌟 'हमारे बारे में' CMS API (ABOUT US SYSTEMS)
// ==========================================

app.post('/api/cms/about', async (req, res) => {
  try {
    const newContent = req.body;
    const updatedData = await CmsAboutData.findOneAndUpdate(
      {}, 
      { content: newContent },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "About Us का डेटा सफलतापूर्वक लाइव हो गया है!", data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर, डेटा सेव नहीं हुआ।" });
  }
});

app.get('/api/cms/about', async (req, res) => {
  try {
    const data = await CmsAboutData.findOne();
    if (data) {
      res.status(200).json({ success: true, content: data.content });
    } else {
      res.status(404).json({ success: false, message: "अभी तक कोई About Us डेटा सेव नहीं किया गया है।" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर।" });
  }
});

// ==========================================
// 👔 'प्रतिनिधि एवं अधिकारी' CMS API (REPS SYSTEMS)
// ==========================================

app.post('/api/cms/reps', async (req, res) => {
  try {
    const updatedData = await CmsRepsData.findOneAndUpdate(
      {}, 
      { content: req.body },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "प्रतिनिधियों का डेटा लाइव हो गया!", data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर, डेटा सेव नहीं हुआ।" });
  }
});

app.get('/api/cms/reps', async (req, res) => {
  try {
    const data = await CmsRepsData.findOne();
    if (data) {
      res.status(200).json({ success: true, content: data.content });
    } else {
      res.status(404).json({ success: false, message: "डेटा नहीं मिला।" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर।" });
  }
});

// ==========================================
// 🛡️ प्रोफाइल और पासवर्ड अपडेट API (Settings)
// ==========================================

app.put('/api/admin/update-profile', async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    const updatedStaff = await Staff.findOneAndUpdate(
      { name: name }, 
      { $set: { name, email, mobile } },
      { new: true }
    );

    if (!updatedStaff) return res.status(404).json({ success: false, message: "स्टाफ नहीं मिला!" });
    res.status(200).json({ success: true, message: "प्रोफाइल अपडेट हो गई!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर!" });
  }
});

app.put('/api/admin/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    const staff = await Staff.findOne({ username });
    if (!staff) return res.status(404).json({ success: false, message: "यूजर नहीं मिला!" });

    const isMatch = await bcrypt.compare(currentPassword, staff.password); 
    if (!isMatch) return res.status(400).json({ success: false, message: "वर्तमान पासवर्ड गलत है!" });

    const salt = await bcrypt.genSalt(10);
    staff.password = await bcrypt.hash(newPassword, salt);
    await staff.save();

    res.status(200).json({ success: true, message: "पासवर्ड बदल गया!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "सर्वर एरर!" });
  }
});

// 🚀 सर्वर चालू करें
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 बैकएंड सर्वर पोर्ट ${PORT} पर एकदम रेडी है...`));