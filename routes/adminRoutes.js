const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// 🟢 मान लेते हैं कि आपका Admin Schema इस प्रकार है (अगर पहले से बना है तो अपना मॉडल इस्तेमाल करें)
// यदि मॉडल पहले से बना है, तो इस Schema वाले हिस्से को हटाकर अपने मॉडल को require() कर लें।
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
  role: { type: String, default: 'Admin' }
});

// यदि मॉडल पहले से रजिस्टर्ड नहीं है तो ही इसे अनकमिट करें
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);


// ============================================================
// 🎯 राउट 1: प्रोफाइल डिटेल्स अपडेट करना (PUT /api/admin/update-profile)
// ============================================================
router.put('/api/admin/update-profile', async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // नोट: यहाँ हम मान रहे हैं कि वर्तमान लॉगइन एडमिन की पहचान सेशन/टोकन या नाम से हो रही है।
    // यहाँ हम 'adminName' या किसी फिक्स यूजरनेम के आधार पर अपडेट कर रहे हैं।
    // यदि आप JWT इस्तेमाल कर रहे हैं, तो req.user.id से भी इसे बदल सकते हैं।
    const updatedAdmin = await Admin.findOneAndUpdate(
      { name: req.body.name }, // आपके फॉर्म से आ रहे नाम के आधार पर ढूंढना
      { 
        $set: { 
          name: name,
          email: email,
          mobile: mobile 
        } 
      },
      { new: true } // ताकि अपडेटेड डेटा वापस मिले
    );

    if (!updatedAdmin) {
      return res.status(444).json({ 
        success: false, 
        message: "❌ एडमिन रिकॉर्ड नहीं मिला या नाम मैच नहीं हुआ।" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ प्रोफाइल सफलतापूर्वक अपडेट हो गई है।",
      data: updatedAdmin
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "❌ सर्वर में कोई समस्या आई।" 
    });
  }
});


// ============================================================
// 🎯 राउट 2: पासवर्ड बदलना (PUT /api/admin/change-password)
// ============================================================
router.put('/api/admin/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    // 1. डेटाबेस में एडमिन को ढूंढें
    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      return res.status(444).json({ 
        success: false, 
        message: "❌ यूजर नहीं मिला।" 
      });
    }

    // 2. वर्तमान (पुराना) पासवर्ड मैच करें
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ वर्तमान पासवर्ड गलत है।" 
      });
    }

    // 3. नए पासवर्ड को हैश (Encrypt) करें
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. नया हैश किया हुआ पासवर्ड डेटाबेस में सुरक्षित करें
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "🔒 पासवर्ड सफलतापूर्वक बदल दिया गया है।"
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "❌ सर्वर में कोई समस्या आई।" 
    });
  }
});

module.exports = router;