const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // यहाँ हमने आपका नया ऑनलाइन MongoDB Atlas का लिंक डाल दिया है
        await mongoose.connect('mongodb+srv://ankit:ankit123@ankit.dbp6iwn.mongodb.net/ahiraura_panchayat?appName=ankit');
        console.log('✅ Database Connected Successfully');
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;