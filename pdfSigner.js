const fs = require('fs');
const { signpdf } = require('@signpdf/signpdf');
const { P12Signer } = require('@signpdf/signer-p12');
const { plainAddPlaceholder } = require('@signpdf/placeholder-plain');

async function digitallySignPDF(pdfBuffer) {
    try {
        // 1. आपकी .p12 फाइल और पासवर्ड (जो आपने जनरेट किया था)
        const p12Buffer = fs.readFileSync('./pradhan_sign.p12');
        const signer = new P12Signer(p12Buffer, '123456');

        // 2. PDF में सिग्नेचर के लिए एक अदृश्य जगह (Placeholder) बनाएँ
        const pdfWithPlaceholder = plainAddPlaceholder({
            pdfBuffer: pdfBuffer,
            reason: 'ग्राम पंचायत प्रमाण पत्र स्वीकृति',
            location: 'ग्राम पंचायत अहिरौरा, बहराइच',
            name: 'Dr. Shyam Kumar Chaudhary',
            contactInfo: '9838111751'
        });

        // 3. PDF पर असली डिजिटल सिग्नेचर लगाएँ
        const signedPdfBuffer = await signpdf.sign(pdfWithPlaceholder, signer);
        return signedPdfBuffer;
    } catch (error) {
        console.error("❌ सिग्नेचर लगाने में एरर:", error);
        throw error;
    }
}

module.exports = { digitallySignPDF };