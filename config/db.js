const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 🟢 सुरक्षित तरीका: अब डेटाबेस का लिंक .env फाइल से लिया जाएगा
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Database Connected Successfully (ahirauraDB)');
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;