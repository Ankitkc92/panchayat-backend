const mongoose = require('mongoose');

// CMS के पूरे होम पेज का स्कीमा (Schema)
const cmsHomeSchema = new mongoose.Schema({
  content: {
    pradhanData: {
      name: String,
      message: String
    },
    statsData: {
      population: String,
      wards: String,
      literacy: String,
      staff: String
    },
    // Array के रूप में सेव करने के लिए
    notices: Array,
    services: Array,
    testimonials: Array,
    portals: Array
  }
}, { timestamps: true });

// 'CmsHomeData' नाम से कलेक्शन बनेगा
module.exports = mongoose.model('CmsHomeData', cmsHomeSchema);