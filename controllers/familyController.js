const Family = require('../models/Family');

// 1. सभी परिवारों का डेटा लाने के लिए (सदस्यों सहित पूरा डेटा)
exports.getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find(); 
    res.json(families);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// 2. ID द्वारा किसी एक परिवार का डेटा लाने के लिए
exports.getFamilyById = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    res.json(family);
  } catch (error) {
    res.status(500).json({ message: "Error fetching family", error });
  }
};

// 3. नया परिवार (मुखिया) जोड़ने के लिए (फोटो के साथ)
exports.addFamily = async (req, res) => {
  try {
    const familyData = { ...req.body };

    // अपलोड की गई मुखिया की फोटो का रास्ता (Path) सेव करें
    if (req.files && req.files.headProfilePhoto) {
      familyData.headProfilePhotoPath = req.files.headProfilePhoto[0].path;
    }
    if (req.files && req.files.headAadharFront) {
      familyData.headAadharFrontPath = req.files.headAadharFront[0].path;
    }
    if (req.files && req.files.headAadharBack) {
      familyData.headAadharBackPath = req.files.headAadharBack[0].path;
    }

    const newFamily = new Family(familyData);
    await newFamily.save();
    res.status(201).json({ message: "Family Added Successfully", data: newFamily });
  } catch (error) {
    res.status(500).json({ message: "Error adding family", error });
  }
};

// 4. परिवार में नया सदस्य जोड़ने के लिए (फोटो के साथ)
exports.addMember = async (req, res) => {
  try {
    const hofId = req.params.hofId;
    const memberData = { ...req.body };

    // अपलोड की गई सदस्य की फोटो का रास्ता (Path) सेव करें
    if (req.files && req.files.memberAadharFront) {
      memberData.aadharFrontPath = req.files.memberAadharFront[0].path;
    }
    if (req.files && req.files.memberAadharBack) {
      memberData.aadharBackPath = req.files.memberAadharBack[0].path;
    }

    const updatedFamily = await Family.findByIdAndUpdate(
      hofId,
      { $push: { members: memberData } },
      { new: true }
    );
    res.json({ message: "Member Added Successfully", data: updatedFamily });
  } catch (error) {
    res.status(500).json({ message: "Error adding member", error });
  }
};

// 5. मुखिया का डेटा अपडेट (Edit) करने के लिए
exports.updateFamily = async (req, res) => {
  try {
    const updatedFamily = await Family.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Family Updated Successfully", data: updatedFamily });
  } catch (error) {
    res.status(500).json({ message: "Error updating family", error });
  }
};

// 6. पूरा परिवार डिलीट (Delete) करने के लिए
exports.deleteFamily = async (req, res) => {
  try {
    await Family.findByIdAndDelete(req.params.id);
    res.json({ message: "Family Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting family", error });
  }
};

// 7. परिवार के किसी एक सदस्य को डिलीट करने के लिए
exports.deleteMember = async (req, res) => {
  try {
    const { hofId, memberId } = req.params;
    const updatedFamily = await Family.findByIdAndUpdate(
      hofId,
      { $pull: { members: { _id: memberId } } },
      { new: true }
    );
    res.json({ message: "Member Deleted Successfully", data: updatedFamily });
  } catch (error) {
    res.status(500).json({ message: "Error deleting member", error });
  }
};

// 8. परिवार के किसी एक सदस्य का डेटा अपडेट करने के लिए
exports.updateMember = async (req, res) => {
  try {
    const { hofId, memberId } = req.params;
    const updateData = {};
    
    // फॉर्म से आए हुए नए टेक्स्ट डेटा को सेट करना
    for (let key in req.body) {
      updateData[`members.$.${key}`] = req.body[key];
    }

    const updatedFamily = await Family.findOneAndUpdate(
      { _id: hofId, "members._id": memberId },
      { $set: updateData },
      { new: true }
    );
    res.json({ message: "Member Updated Successfully", data: updatedFamily });
  } catch (error) {
    res.status(500).json({ message: "Error updating member", error });
  }
};