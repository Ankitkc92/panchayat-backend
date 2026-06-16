const mongoose = require('mongoose');

// परिवार के सदस्य का स्कीमा (सभी 12 कॉलम के अनुसार)
const memberSchema = new mongoose.Schema({
  memberName: { type: String, required: true },
  pitapatiKaNam: String,
  purushYaStri: String,
  dharmAnusuchitJatiKiDashaMeJati: String,
  janmaTithi: Date,
  vyavasay: String,
  saksharNiraksharAakarHoneKiDashaMeAhetaAurByoreSahit: String,
  sanketChodDeneYaMrityuKaDinaank: Date,
  abhiyuktiyanVivaran: String,
  aadharFrontPath: String, 
  aadharBackPath: String,  
});

// परिवार के मुखिया का स्कीमा
const familySchema = new mongoose.Schema({
  familyId: { type: String, required: true, unique: true },
  headName: { type: String, required: true },
  houseNo: String,
  majra: String,
  villageName: String,
  parganaPanchayat: String,
  vikasKhand: String,
  tehsil: String,
  district: String,
  pitapatiKaNam: String,
  purushYaStri: String,
  dharmAnusuchitJatiKiDashaMeJati: String,
  janmaTithiYadiJnatHoAthwaSambhashyaJanmaTithi: Date,
  vyavasay: String,
  saksharNiraksharAakarHoneKiDashaMeAhetaAurByoreSahit: String,
  sanketChodDeneYaMrityuKaDinaank: Date,
  abhiyuktiyanVivaran: String,
  mobile: String, // जोड़ा गया
  headProfilePhotoPath: String, 
  headAadharFrontPath: String,   
  headAadharBackPath: String,    
  members: [memberSchema] 
});

module.exports = mongoose.model('Family', familySchema);