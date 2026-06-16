const express = require('express');
const router = express.Router();
const CmsHomeData = require('../models/CmsHomeData');

// 🟢 1. CMS डेटा सेव या अपडेट करने के लिए (POST API)
router.post('/homepage', async (req, res) => {
  try {
    // React से भेजा गया सारा डेटा req.body में आएगा
    const newContent = req.body;

    // findOneAndUpdate: अगर डेटाबेस में पहले से कोई रिकॉर्ड है तो उसे अपडेट करेगा,
    // अगर नहीं है तो नया बना देगा (upsert: true)
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

// 🟢 2. वेबसाइट पर दिखाने के लिए डेटा भेजने वाली (GET API)
router.get('/homepage', async (req, res) => {
  try {
    const data = await CmsHomeData.findOne(); // पहला रिकॉर्ड ढूँढेगा

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

module.exports = router;