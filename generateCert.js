const forge = require('node-forge');
const fs = require('fs');

console.log('⏳ प्राइवेट की (Private Key) और सर्टिफिकेट बन रहा है... इसमें कुछ सेकंड लग सकते हैं...');

// 1. 2048-bit RSA Key Pair जनरेट करें
const keys = forge.pki.rsa.generateKeyPair(2048);

// 2. नया सर्टिफिकेट (X.509) बनाएँ
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';

// 3. वैलिडिटी (10 साल के लिए) सेट करें
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

// 4. प्रधान जी और पंचायत का विवरण (Subject)
const attrs = [
  { name: 'commonName', value: 'Dr. Shyam Kumar Chaudhary' },
  { name: 'organizationName', value: 'Gram Panchayat Ahiraura' },
  { name: 'countryName', value: 'IN' }
];
cert.setSubject(attrs);
cert.setIssuer(attrs); // Self-signed है इसलिए Issuer भी वही होगा

// 5. सर्टिफिकेट को प्राइवेट की से साइन करें
cert.sign(keys.privateKey, forge.md.sha256.create());

// 6. .p12 (PKCS#12) फॉर्मेट में पैक करें और पासवर्ड (123456) सेट करें
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey,
  [cert],
  '123456', // 🔒 आपका पासवर्ड
  { algorithm: '3des' }
);

// 7. फाइल को सिस्टम में सेव करें
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
fs.writeFileSync('pradhan_sign.p12', Buffer.from(p12Der, 'binary'));

console.log('🎉 बधाई हो! आपकी "pradhan_sign.p12" फाइल सफलतापूर्वक बन गई है!');