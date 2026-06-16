const express = require('express');
const router = express.Router();

// कंट्रोलर से सभी फंक्शन्स को इम्पोर्ट करना
const { 
  getAllFamilies, 
  getFamilyById, 
  addFamily, 
  addMember, 
  updateFamily, 
  deleteFamily, 
  deleteMember, 
  updateMember 
} = require('../controllers/familyController');

// फोटो अपलोड मिडिलवेयर को इम्पोर्ट करना
const { hofUploadFields, memberUploadFields } = require('../middleware/uploads');

// मुखिया (HoF) के रास्ते
router.get('/all', getAllFamilies);
router.get('/get-by-id/:id', getFamilyById);
router.post('/add', hofUploadFields, addFamily);
router.put('/update/:id', updateFamily);
router.delete('/delete/:id', deleteFamily);

// परिवार के सदस्यों (Members) के रास्ते
router.post('/add-member/:hofId', memberUploadFields, addMember);
router.delete('/delete-member/:hofId/:memberId', deleteMember);
router.put('/update-member/:hofId/:memberId', updateMember);

module.exports = router;