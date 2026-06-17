require('dotenv').config(); // 🟢 सबसे ज़रूरी: .env फाइल को पढ़ने के लिए
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 🟢 CORS सेटिंग
const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost:5000",
    "https://admin-panel-wqzg.onrender.com", // आपका एडमिन पैनल
    "https://citizen-portal-bsl7.onrender.com" // 🟢 आपका नया सिटीज़न पोर्टल
  ],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// 📁 Uploads फोल्डर चेक करें और बनाएं (फोटोज़ और आधार के लिए)
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// 🟢 Multer सेटअप (फाइल सेव करने की सेटिंग)
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 🟢 MongoDB कनेक्शन (सुरक्षित तरीके से .env फाइल के साथ) - SECURED 🛡️
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
// 🏢 Schema: स्टाफ और रोल्स (Staff Management) - 🟢 नया
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
      await Staff.create({ 
        username: 'admin', 
        password: 'panchayat@123', 
        name: 'मास्टर एडमिन', 
        role: 'Admin' 
      });
      console.log("✅ डिफ़ॉल्ट मास्टर एडमिन अकाउंट बन गया है!");
    }
  } catch (error) { console.log("Admin Error:", error); }
};
createDefaultAdmin();

// ==========================================
// 1️⃣ Schema: सिटीजन पोर्टल (नागरिकों के लिए)
// ==========================================
const CitizenSchema = new mongoose.Schema({
  familyId: String, 
  fullName: String, 
  fatherName: String, 
  gender: String, 
  aadhaarNo: String, 
  mobile: String, 
  email: { type: String, unique: true }, 
  password: String,
  profilePicPath: String, 
  aadhaarPicPath: String,
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
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
  complaintId: String,      // शिकायत संख्या (e.g., CMP-101)
  familyId: String,         // शिकायतकर्ता की ID
  citizenName: String,      // नाम
  mobile: String,           // मोबाइल नंबर
  complaintType: String,    // नाली, पानी, बिजली आदि
  description: String,      // शिकायत का पूरा विवरण
  photoPath: String,        // सबूत (फोटो)
  status: { type: String, default: 'Pending' }, // Pending, In Progress, Resolved, Rejected
  adminRemarks: { type: String, default: '' },  // प्रधान जी का जवाब
  createdAt: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('Complaint', ComplaintSchema);

// ==========================================
// 4️⃣ Schema: प्रमाण पत्र प्रबंधन (Certificate System)
// ==========================================
const CertificateSchema = new mongoose.Schema({
  applicationId: String,    // आवेदन संख्या (e.g., APP/PR/26-27/0001)
  certificateId: { type: String, default: null }, // प्रमाण पत्र क्रमांक
  familyId: String,         // आवेदक की ID
  citizenName: String,      // आवेदक का नाम
  mobile: String,           // मोबाइल नंबर
  certificateType: String,  // प्रमाण पत्र का प्रकार
  serviceAction: { type: String, default: 'NEW_COPY' }, // 🟢 नया: परिवार रजिस्टर सेवा का प्रकार
  description: String,      // 🟢 आवेदन का कारण / विवरण (JSON फॉर्मेट में)
  applicantAadharPath: String, // आवेदक का आधार
  supportingDocPath: String,   // अन्य जरूरी दस्तावेज
  memberAadharFrontPath: String, // 🟢 नए सदस्य का आधार फ्रंट
  memberAadharBackPath: String,  // 🟢 नए सदस्य का आधार बैक
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  adminRemarks: { type: String, default: '' },  // प्रधान जी की टिप्पणी
  createdAt: { type: Date, default: Date.now }
});
const Certificate = mongoose.model('Certificate', CertificateSchema);

// ==========================================
// 5️⃣ Schema: प्रोफाइल अपडेट अनुरोध (Profile Update System)
// ==========================================
const ProfileUpdateSchema = new mongoose.Schema({
  requestId: String,        // e.g., REQ-1001
  familyId: String,         // नागरिक की फैमिली ID
  citizenName: String,      // नागरिक का नाम
  oldData: Object,          // पुराना डेटा { mobile, email }
  newData: Object,          // नया डेटा { mobile, email, voterId }
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  requestDate: { type: Date, default: Date.now }
});
const ProfileUpdate = mongoose.model('ProfileUpdate', ProfileUpdateSchema);

// ==========================================
// 6️⃣ Schema: सूचना पट्ट (Notice Board)
// ==========================================
const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },       // सूचना का शीर्षक
  content: { type: String, required: true },     // सूचना का विवरण
  isActive: { type: Boolean, default: true },    // वेबसाइट पर दिखाना है या नहीं
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
  financialYear: String, // इसी में हम 'बिलिंग का महीना' सेव करेंगे
  status: { type: String, default: 'Pending' }, // Pending, Paid
  paymentDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Tax = mongoose.model('Tax', TaxSchema);

// ==========================================
// 8️⃣ Schema: मुख्य होम पेज (CMS Data) - 🟢 नया (NEW ADDITION)
// ==========================================
const CmsHomeSchema = new mongoose.Schema({
  content: {
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
// 🚀 API Routes (सारे रास्ते)
// ==========================================

// ==========================================
// 🏢 स्टाफ प्रबंधन API (STAFF MANAGEMENT) - 🟢 नया 
// ==========================================

// 1. एडमिन / स्टाफ लॉगिन API
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Staff.findOne({ username, password });
    
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

// 2. स्टाफ लिस्ट मंगाना
app.get('/api/admin/staff/all', async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json(staff);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में एरर" }); 
  }
});

// 3. नया स्टाफ जोड़ना
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

// 4. स्टाफ सस्पेंड करना
app.put('/api/admin/staff/suspend/:id', async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, { status: 'Suspended' }, { new: true });
    res.status(200).json({ message: "अकाउंट सस्पेंड कर दिया गया है।", data: updatedStaff });
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
    const { familyId, fullName, fatherName, gender, aadhaarNo, mobile, email, password } = req.body;
    
    const existingUser = await Citizen.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "यह ईमेल पहले से रजिस्टर्ड है!" });
    }

    const newCitizen = new Citizen({
      familyId, fullName, fatherName, gender, aadhaarNo, mobile, email, password,
      profilePicPath: req.files && req.files['profilePic'] ? req.files['profilePic'][0].path : '',
      aadhaarPicPath: req.files && req.files['aadhaarPic'] ? req.files['aadhaarPic'][0].path : ''
    });

    await newCitizen.save();
    res.status(201).json({ message: "पंजीकरण सफलतापूर्वक पूरा हुआ!" });
  } catch (error) {
    console.log("रजिस्ट्रेशन एरर:", error);
    res.status(500).json({ message: "सर्वर एरर: पंजीकरण विफल रहा।" });
  }
});

// ==========================================
// 🟢 [CITIZEN API] 2. नागरिक लॉगिन
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Citizen.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "यह ईमेल रजिस्टर नहीं है! पहले पंजीकरण करें।" });
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
      user: { fullName: user.fullName, email: user.email, familyId: user.familyId, mobile: user.mobile } 
    });
  } catch (error) {
    console.log("लॉगिन एरर:", error);
    res.status(500).json({ message: "सर्वर एरर" });
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

// ==========================================
// 🏛️ [ADMIN API] 4. नागरिक को Approve/Reject करना
// ==========================================
app.put('/api/admin/citizen/status/:id', async (req, res) => {
  try {
    const updatedCitizen = await Citizen.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.status(200).json({ message: "स्टेटस अपडेट हो गया", data: updatedCitizen });
  } catch (error) { 
    res.status(500).json({ message: "स्टेटस अपडेट करने में एरर" }); 
  }
});

// ==========================================
// 🏛️ [ADMIN API] 5. नागरिक विवरण अपडेट करना
// ==========================================
app.put('/api/admin/citizen/update/:id', async (req, res) => {
  try {
    const updatedData = await Citizen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "डेटा अपडेट हो गया", data: updatedData });
  } catch (error) { 
    res.status(500).json({ message: "अपडेट करने में एरर" }); 
  }
});

// ==========================================
// 🏛️ [ADMIN API] 6. नागरिक डिलीट करना
// ==========================================
app.delete('/api/admin/citizen/delete/:id', async (req, res) => {
  try {
    await Citizen.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "नागरिक डिलीट हो गया" });
  } catch (error) { 
    res.status(500).json({ message: "डिलीट करने में एरर" }); 
  }
});

// ==========================================
// 🏛️ [ADMIN API] 7. परिवार रजिस्टर का पूरा डेटा मंगाना
// ==========================================
app.get('/api/family/all', async (req, res) => {
  try { 
    const families = await Family.find().sort({ createdAt: -1 }); 
    res.status(200).json(families); 
  } catch (error) { 
    res.status(500).json({ message: "परिवार का डेटा मंगाने में त्रुटि" }); 
  }
});

// ==========================================
// 🏛️ [ADMIN API] 8. नया परिवार जोड़ना (मुखिया)
// ==========================================
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
// 🏛️ [ADMIN API] 9. परिवार डिलीट करना
// ==========================================
app.delete('/api/family/delete/:id', async (req, res) => {
  try { 
    await Family.findByIdAndDelete(req.params.id); 
    res.status(200).json({ message: "परिवार हटा दिया गया" }); 
  } catch (error) { 
    res.status(500).json({ message: "परिवार डिलीट करने में त्रुटि" }); 
  }
});

// ==========================================
// 🟢 [CITIZEN API] 10. नागरिक के लिए अपना परिवार देखना
// ==========================================
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

// ==========================================
// 🏛️ [ADMIN API] 11. परिवार में नया सदस्य जोड़ना
// ==========================================
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

// ==========================================
// 🏛️ [ADMIN API] 12. परिवार के सदस्य को अपडेट करना
// ==========================================
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

// ==========================================
// 🏛️ [ADMIN API] 13. परिवार के सदस्य को डिलीट करना
// ==========================================
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

// 🟢 [CITIZEN API] 14. नई शिकायत दर्ज करना
app.post('/api/complaint/add', upload.single('complaintPhoto'), async (req, res) => {
  try {
    const { familyId, citizenName, mobile, complaintType, description } = req.body;
    
    const count = await Complaint.countDocuments();
    const complaintId = `CMP-${count + 101}`;

    const newComplaint = new Complaint({
      complaintId, familyId, citizenName, mobile, complaintType, description,
      photoPath: req.file ? req.file.path : ''
    });
    
    await newComplaint.save();
    res.status(201).json({ message: `आपकी शिकायत (${complaintId}) सफलतापूर्वक दर्ज हो गई है!` });
  } catch (error) {
    res.status(500).json({ message: "शिकायत दर्ज करने में त्रुटि आई।" });
  }
});

// 🟢 [CITIZEN API] 15. अपनी शिकायतें देखना
app.get('/api/complaint/my/:familyId', async (req, res) => {
  try {
    const complaints = await Complaint.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) { 
    res.status(500).json({ message: "शिकायतें लाने में त्रुटि।" }); 
  }
});

// 🏛️ [ADMIN API] 16. सभी पंचायत की शिकायतें देखना
app.get('/api/admin/complaints/all', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) { 
    res.status(500).json({ message: "शिकायतें लाने में त्रुटि।" }); 
  }
});

// 🏛️ [ADMIN API] 17. शिकायत का स्टेटस / जवाब अपडेट करना
app.put('/api/admin/complaint/update/:id', async (req, res) => {
  try {
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status, adminRemarks: req.body.adminRemarks }, 
      { new: true }
    );
    res.status(200).json({ message: "शिकायत का स्टेटस अपडेट हो गया।", data: updatedComplaint });
  } catch (error) { 
    res.status(500).json({ message: "अपडेट करने में त्रुटि।" }); 
  }
});

// ==========================================
// 📜 प्रमाण पत्र प्रबंधन API (CERTIFICATES)
// ==========================================

// 🟢 [CITIZEN API] 18. नए प्रमाण पत्र के लिए आवेदन करना
app.post('/api/certificate/apply', upload.fields([
  { name: 'applicantAadhar', maxCount: 1 }, 
  { name: 'supportingDoc', maxCount: 1 },
  { name: 'memberAadharFront', maxCount: 1 }, 
  { name: 'memberAadharBack', maxCount: 1 }  
]), async (req, res) => {
  try {
    const { familyId, citizenName, mobile, certificateType, description, serviceAction } = req.body;
    
    // 🟢 वित्तीय वर्ष के अनुसार स्वचालित रूप से Prefix तैयार करना
    const fy = getFinancialYearString();
    const prefix = `APP/PR/${fy}/`;
    
    const count = await Certificate.countDocuments({ applicationId: { $regex: '^' + prefix } });
    const nextSequence = String(count + 1).padStart(4, '0');
    const applicationId = `${prefix}${nextSequence}`;

    const newCertificate = new Certificate({
      applicationId, 
      certificateId: null, 
      familyId, 
      citizenName, 
      mobile, 
      certificateType, 
      serviceAction: serviceAction || 'NEW_COPY',
      description,
      applicantAadharPath: req.files && req.files['applicantAadhar'] ? req.files['applicantAadhar'][0].path : '',
      supportingDocPath: req.files && req.files['supportingDoc'] ? req.files['supportingDoc'][0].path : '',
      memberAadharFrontPath: req.files && req.files['memberAadharFront'] ? req.files['memberAadharFront'][0].path : '', 
      memberAadharBackPath: req.files && req.files['memberAadharBack'] ? req.files['memberAadharBack'][0].path : ''    
    });
    
    await newCertificate.save();
    res.status(201).json({ message: `आपका ${certificateType} का आवेदन (ID: ${applicationId}) सफलतापूर्वक जमा हो गया है!` });
  } catch (error) {
    console.log("आवेदन त्रुटि:", error);
    res.status(500).json({ message: "आवेदन जमा करने में त्रुटि आई।" });
  }
});

// 🟢 [CITIZEN API] 19. अपने प्रमाण पत्र आवेदनों की स्थिति देखना
app.get('/api/certificate/my/:familyId', async (req, res) => {
  try {
    const certificates = await Certificate.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" }); 
  }
});

// 🏛️ [ADMIN API] 20. पंचायत के सभी प्रमाण पत्र आवेदन देखना
app.get('/api/admin/certificates/all', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) { 
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" }); 
  }
});

// 🏛️ [ADMIN API] 21. 💥 प्रमाण पत्र अप्रूव करना और परिवार रजिस्टर लाइव सिंक (Auto-Sync) करना 💥
app.put('/api/admin/certificate/update/:id', async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    let updateFields = { status, adminRemarks };

    const currentCert = await Certificate.findById(req.params.id);
    if (!currentCert) return res.status(404).json({ message: "आवेदन नहीं मिला" });

    // यदि स्वीकृत हो रहा है, तो CERT ID बनाएं (अगर पहले से नहीं है)
    if (status === 'Approved' && !currentCert.certificateId) {
      const fy = getFinancialYearString();
      const prefix = `CERT/PR/${fy}/`;
      const count = await Certificate.countDocuments({ certificateId: { $regex: '^' + prefix } });
      const nextSequence = String(count + 1).padStart(4, '0');
      updateFields.certificateId = `${prefix}${nextSequence}`;
    }

    // डेटाबेस में सर्टिफिकेट का स्टेटस अपडेट करें
    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id, 
      updateFields, 
      { new: true }
    );

    // 💥 असली जादू: अगर आवेदन परिवार रजिस्टर का है और अप्रूव हो गया, तो लाइव डेटाबेस सिंक करें
    if (status === 'Approved' && updatedCertificate.certificateType.includes("परिवार रजिस्टर")) {
      const { familyId, description, serviceAction, memberAadharFrontPath, memberAadharBackPath } = updatedCertificate;
      
      let parsedData = {};
      try {
        parsedData = JSON.parse(description); // 🟢 फ्रंटएंड से आए JSON को पढ़ना
      } catch (e) {
        console.log("JSON Parse Error", e);
      }

      // 🟢 केस A: नया नाम जोड़ना (ADD_MEMBER)
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
          abhiyuktiyanVivaran: parsedData.abhiyuktiyan || "ऑनलाइन सिटिजन पोर्टल द्वारा स्वीकृत",
          aadharFrontPath: memberAadharFrontPath || '',
          aadharBackPath: memberAadharBackPath || ''
        };
        
        await Family.updateOne(
          { familyId: familyId.trim() },
          { $push: { members: newMember } }
        );
        console.log(`✅ परिवार ${familyId} में नया सदस्य ${parsedData.memberName} लाइव जुड़ गया!`);
      } 
      // 🔴 केस B: नाम हटाना / मृत्यु (REMOVE_MEMBER)
      else if (serviceAction === 'REMOVE_MEMBER') {
        const deceasedName = parsedData.deceasedName;
        const dod = parsedData.dod;
        
        await Family.updateOne(
          { familyId: familyId.trim(), "members.memberName": deceasedName },
          { $set: { 
              "members.$.sanketChodDeneYaMrityuKaDinaank": dod ? new Date(dod).toISOString() : new Date().toISOString(), 
              "members.$.abhiyuktiyanVivaran": "मृत्यु / अन्य कारण से नाम निरस्त" 
            } 
          }
        );
        console.log(`❌ परिवार ${familyId} से सदस्य ${deceasedName} का नाम निरस्त किया गया!`);
      }
    }

    res.status(200).json({ message: "आवेदन का स्टेटस अपडेट हो गया।", data: updatedCertificate });
  } catch (error) { 
    console.log("अपडेट त्रुटि:", error);
    res.status(500).json({ message: "अपडेट करने में त्रुटि।" }); 
  }
});

// 🏛️ [ADMIN API] 22. 🗑️ फालतू आवेदन डिलीट करने का API
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

// 🟢 [CITIZEN API] 23. नागरिक द्वारा प्रोफाइल अपडेट का अनुरोध भेजना
app.post('/api/profile/request-update', async (req, res) => {
  try {
    const { familyId, citizenName, oldData, newData } = req.body;
    
    const count = await ProfileUpdate.countDocuments();
    const requestId = `REQ-${count + 1001}`;

    const newRequest = new ProfileUpdate({
      requestId,
      familyId,
      citizenName,
      oldData,
      newData
    });
    
    await newRequest.save();
    res.status(201).json({ message: "आपकी रिक्वेस्ट दर्ज हो गई है!" });
  } catch (error) {
    console.log("Update Request Error:", error);
    res.status(500).json({ message: "रिक्वेस्ट दर्ज करने में त्रुटि आई।" });
  }
});

// 🏛️ [ADMIN API] 24. एडमिन के लिए सभी 'Pending' रिक्वेस्ट लाना
app.get('/api/admin/profile-requests', async (req, res) => {
  try {
    const requests = await ProfileUpdate.find({ status: 'Pending' }).sort({ requestDate: -1 });
    
    const formattedRequests = requests.map(req => ({
      id: req.requestId,
      citizenName: req.citizenName,
      familyId: req.familyId,
      oldData: req.oldData,
      newData: req.newData,
      requestDate: new Date(req.requestDate).toLocaleDateString('en-GB')
    }));
    
    res.status(200).json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: "डेटा लाने में त्रुटि।" });
  }
});

// 🏛️ [ADMIN API] 25. ✅ रिक्वेस्ट को अप्रूव करना और असली डेटा अपडेट करना
app.post('/api/admin/approve-profile/:requestId', async (req, res) => {
  try {
    const request = await ProfileUpdate.findOne({ requestId: req.params.requestId });
    if (!request) return res.status(404).json({ message: "रिक्वेस्ट नहीं मिली!" });

    // Citizen (नागरिक) के मुख्य डेटाबेस में नया मोबाइल और ईमेल अपडेट करें
    const citizen = await Citizen.findOne({ familyId: request.familyId, email: request.oldData.email });
    
    if (citizen) {
      if (request.newData.mobile) citizen.mobile = request.newData.mobile;
      if (request.newData.email) citizen.email = request.newData.email;
      await citizen.save();
    }

    // रिक्वेस्ट का स्टेटस 'Approved' कर दें
    request.status = 'Approved';
    await request.save();

    res.status(200).json({ message: "प्रोफाइल सफलतापूर्वक अपडेट कर दी गई है!" });
  } catch (error) {
    console.log("Approve Error:", error);
    res.status(500).json({ message: "अप्रूव करने में त्रुटि आई।" });
  }
});

// 🏛️ [ADMIN API] 26. ❌ रिक्वेस्ट को रिजेक्ट (रद्द) करना
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

// 27. [PUBLIC API] वेबसाइट पर दिखाने के लिए सभी चालू (Active) सूचनाएं मंगाना
app.get('/api/notices/active', async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "सूचना लाने में त्रुटि।" });
  }
});

// 28. [ADMIN API] एडमिन पैनल के लिए सभी सूचनाएं मंगाना
app.get('/api/admin/notices/all', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "सूचना लाने में त्रुटि।" });
  }
});

// 29. [ADMIN API] नई सूचना जोड़ना
app.post('/api/admin/notice/add', async (req, res) => {
  try {
    const newNotice = new Notice({
      title: req.body.title,
      content: req.body.content,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    await newNotice.save();
    res.status(201).json({ message: "सूचना पट्ट पर सफलतापूर्वक जोड़ दी गई!", data: newNotice });
  } catch (error) {
    res.status(500).json({ message: "सूचना जोड़ने में त्रुटि।" });
  }
});

// 30. [ADMIN API] सूचना अपडेट करना (जैसे: चालू/बंद करना या टेक्स्ट बदलना)
app.put('/api/admin/notice/update/:id', async (req, res) => {
  try {
    const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "सूचना अपडेट कर दी गई!", data: updatedNotice });
  } catch (error) {
    res.status(500).json({ message: "सूचना अपडेट करने में त्रुटि।" });
  }
});

// 31. [ADMIN API] सूचना डिलीट करना
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

// 32. [ADMIN API] सभी बिल/शुल्क मंगाना
app.get('/api/admin/taxes/all', async (req, res) => {
  try {
    const taxes = await Tax.find().sort({ createdAt: -1 });
    res.status(200).json(taxes);
  } catch (error) {
    res.status(500).json({ message: "टैक्स डेटा लाने में एरर" });
  }
});

// 33. [ADMIN API] नया बिल (स्वच्छता शुल्क) जोड़ना
app.post('/api/admin/tax/add', async (req, res) => {
  try {
    const count = await Tax.countDocuments();
    const taxId = `FEE-${count + 1001}`; // जैसे FEE-1001
    const newTax = new Tax({ taxId, ...req.body });
    await newTax.save();
    res.status(201).json({ message: "बिल सफलतापूर्वक जोड़ दिया गया!", data: newTax });
  } catch (error) {
    res.status(500).json({ message: "बिल जोड़ने में एरर" });
  }
});

// 34. [ADMIN API] शुल्क प्राप्त करना (Pending से Paid)
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

// 35. [ADMIN API] रिकॉर्ड डिलीट करना
app.delete('/api/admin/tax/delete/:id', async (req, res) => {
  try {
    await Tax.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "रिकॉर्ड हटा दिया गया।" });
  } catch (error) {
    res.status(500).json({ message: "डिलीट करने में एरर" });
  }
});

// ==========================================
// 🌐 CMS / होम पेज API (CMS MANAGEMENT) - 🟢 नया (NEW ADDITION)
// ==========================================

// 36. [ADMIN API] CMS डेटा सेव या अपडेट करना
app.post('/api/cms/homepage', async (req, res) => {
  try {
    const newContent = req.body;
    
    const updatedData = await CmsHomeData.findOneAndUpdate(
      {}, // खाली ऑब्जेक्ट का मतलब है जो भी पहला रिकॉर्ड मिले उसे अपडेट कर दो
      { content: newContent },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "होम पेज का डेटा सफलतापूर्वक लाइव हो गया है!", data: updatedData });
  } catch (error) {
    console.error("CMS Save Error:", error);
    res.status(500).json({ success: false, message: "सर्वर एरर, डेटा सेव नहीं हुआ।" });
  }
});

// 37. [PUBLIC API] वेबसाइट पर दिखाने के लिए डेटा भेजना
app.get('/api/cms/homepage', async (req, res) => {
  try {
    const data = await CmsHomeData.findOne();

    if (data) {
      res.status(200).json({ success: true, content: data.content });
    } else {
      res.status(404).json({ success: false, message: "अभी तक कोई डेटा सेव नहीं किया गया है।" });
    }
  } catch (error) {
    console.error("CMS Fetch Error:", error);
    res.status(500).json({ success: false, message: "सर्वर एरर।" });
  }
});

// 🚀 सर्वर चालू करें
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 बैकएंड सर्वर पोर्ट ${PORT} पर एकदम रेडी है...`));