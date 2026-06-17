const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 🟢 यहाँ हमने आपका नया और सही ऑनलाइन MongoDB Atlas का लिंक (ahirauraDB) डाल दिया है
        await mongoose.connect('mongodb+srv://ankit:ankit123@ankit.dbp6iwn.mongodb.net/ahirauraDB?appName=ankit');
        console.log('✅ Database Connected Successfully (ahirauraDB)');
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;