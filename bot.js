// ============================================================
// بوت ديف كرتون - ملف واحد كامل
// ============================================================

// ===== 1. الإعدادات (ضع التوكنات هنا) =====
const CONFIG = {
    توكن_البوت: '8981288618:AAG8XzqJIrculxGuGJ5-O99xC_7-cgt_SBU',      // من @BotFather
    معرف_الدردشة: '@cvb4_bot',  // من @userinfobot
    ملف_البيانات: 'data.json',
    المنفذ: 3000
};

// ===== 2. استيراد المكتبات =====
const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const المنفذ = CONFIG.المنفذ || 3000;
const رابط_تيليجرام = `https://api.telegram.org/bot${CONFIG.توكن_البوت}`;
const ملف_البيانات = CONFIG.ملف_البيانات || 'data.json';

// ===== 3. دوال تيليجرام =====

// إرسال رسالة
async function أرسل_رسالة(معرف_الدردشة, النص) {
    try {
        const response = await fetch(`${رابط_تيليجرام}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: معرف_الدردشة,
                text: النص,
                parse_mode: 'HTML'
            })
        });
        return await response.json();
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
    }
}

// إرسال ملف
async function أرسل_ملف(معرف_الدردشة, مسار_الملف, التعليق = '') {
    try {
        const formData = new FormData();
        formData.append('chat_id', معرف_الدردشة);
        formData.append('document', fs.createReadStream(مسار_الملف));
        if (التعليق) formData.append('caption', التعليق);

        const response = await fetch(`${رابط_تيليجرام}/sendDocument`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('❌ خطأ في إرسال الملف:', error);
    }
}

// تحميل ملف من تيليجرام
async function تحميل_ملف(معرف_الملف) {
    try {
        const response_ملف = await fetch(`${رابط_تيليجرام}/getFile?file_id=${معرف_الملف}`);
        const بيانات_الملف = await response_ملف.json();
        
        if (!بيانات_الملف.ok) {
            throw new Error('فشل في الحصول على الملف');
        }
        
        const مسار_الملف = بيانات_الملف.result.file_path;
        const رابط_التحميل = `https://api.telegram.org/file/bot${CONFIG.توكن_البوت}/${مسار_الملف}`;
        
        const response = await fetch(رابط_التحميل);
        const buffer = await response.buffer();
        
        return buffer;
    } catch (error) {
        console.error('❌ خطأ في تحميل الملف:', error);
        throw error;
    }
}

// ===== 4. دوال البيانات =====

// حفظ البيانات
async function حفظ_البيانات(المحتوى) {
    try {
        const النص = المحتوى.toString('utf8');
        const البيانات = JSON.parse(النص);
        
        if (!البيانات.cartoons || !Array.isArray(البيانات.cartoons)) {
            throw new Error('تنسيق JSON غير صحيح');
        }
        
        fs.writeFileSync(ملف_البيانات, JSON.stringify(البيانات, null, 2));
        console.log('✅ تم حفظ البيانات بنجاح');
        
        return البيانات;
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        throw error;
    }
}

// معالجة الملف المرفوع
async function معالجة_الرفع(معرف_الملف, اسم_الملف, معرف_الدردشة) {
    try {
        await أرسل_رسالة(معرف_الدردشة, '📥 جاري تحميل الملف...');
        const المحتوى = await تحميل_ملف(معرف_الملف);
        
        await أرسل_رسالة(معرف_الدردشة, '📝 جاري حفظ البيانات...');
        const البيانات = await حفظ_البيانات(المحتوى);
        
        const الرسالة = `✅ <b>تم تحديث البيانات بنجاح!</b>\n\n` +
                       `📊 عدد الكرتونات: ${البيانات.cartoons.length}\n` +
                       `📅 الوقت: ${new Date().toLocaleString('ar-SA')}\n\n` +
                       `📄 الملف: ${اسم_الملف}`;
        
        await أرسل_رسالة(معرف_الدردشة, الرسالة);
        await أرسل_ملف(معرف_الدردشة, ملف_البيانات, '📄 البيانات المحدثة');
        
        console.log('✅ تم تحديث البيانات');
        return true;
    } catch (error) {
        await أرسل_رسالة(معرف_الدردشة, `❌ حدث خطأ: ${error.message}`);
        console.error('❌ خطأ في معالجة الملف:', error);
        return false;
    }
}

// ===== 5. ويب هوك (Webhook) =====

app.post('/webhook', express.json(), async (req, res) => {
    try {
        const التحديث = req.body;
        
        if (التحديث.message) {
            const الرسالة = التحديث.message;
            const معرف_الدردشة = الرسالة.chat.id;
            
            // التحقق من المستخدم
            if (معرف_الدردشة.toString() !== CONFIG.معرف_الدردشة) {
                await أرسل_رسالة(معرف_الدردشة, '⚠️ أنت غير مصرح لك');
                return res.status(200).send('OK');
            }
            
            // معالجة الملفات
            if (الرسالة.document) {
                const المستند = الرسالة.document;
                const اسم_الملف = المستند.file_name || 'data.json';
                
                if (اسم_الملف.endsWith('.json')) {
                    await معالجة_الرفع(المستند.file_id, اسم_الملف, معرف_الدردشة);
                } else {
                    await أرسل_رسالة(معرف_الدردشة, '⚠️ يرجى رفع ملف JSON فقط');
                }
            }
            // معالجة الأوامر النصية
            else if (الرسالة.text) {
                const النص = الرسالة.text;
                
                if (النص === '/start') {
                    await أرسل_رسالة(معرف_الدردشة, 
                        '🎬 <b>مرحباً بك في بوت ديف كرتون!</b>\n\n' +
                        '📤 أرسل لي ملف <b>data.json</b> لتحديث البيانات.\n\n' +
                        '📊 الأوامر:\n' +
                        '/status - حالة البيانات\n' +
                        '/download - تحميل البيانات\n' +
                        '/help - المساعدة'
                    );
                }
                else if (النص === '/status') {
                    try {
                        const البيانات = JSON.parse(fs.readFileSync(ملف_البيانات, 'utf8'));
                        await أرسل_رسالة(معرف_الدردشة, 
                            `📊 <b>حالة البيانات</b>\n\n` +
                            `📁 عدد الكرتونات: ${البيانات.cartoons.length}\n` +
                            `📅 آخر تحديث: ${new Date().toLocaleString('ar-SA')}`
                        );
                    } catch (error) {
                        await أرسل_رسالة(معرف_الدردشة, '⚠️ لا توجد بيانات');
                    }
                }
                else if (النص === '/download') {
                    try {
                        if (fs.existsSync(ملف_البيانات)) {
                            await أرسل_ملف(معرف_الدردشة, ملف_البيانات, '📄 البيانات الحالية');
                        } else {
                            await أرسل_رسالة(معرف_الدردشة, '⚠️ لا توجد بيانات');
                        }
                    } catch (error) {
                        await أرسل_رسالة(معرف_الدردشة, '⚠️ حدث خطأ');
                    }
                }
                else if (النص === '/help') {
                    await أرسل_رسالة(معرف_الدردشة,
                        '📖 <b>المساعدة</b>\n\n' +
                        '1️⃣ أرسل ملف data.json لتحديث البيانات\n' +
                        '2️⃣ /status - عرض حالة البيانات\n' +
                        '3️⃣ /download - تحميل البيانات\n' +
                        '4️⃣ /help - هذه الرسالة'
                    );
                }
                else {
                    await أرسل_رسالة(معرف_الدردشة, 
                        '📤 أرسل لي ملف data.json لتحديث البيانات\n' +
                        'أو استخدم /help للمساعدة'
                    );
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).send('Error');
    }
});

// ===== 6. عرض البيانات =====

app.get('/data', (req, res) => {
    try {
        if (fs.existsSync(ملف_البيانات)) {
            const البيانات = fs.readFileSync(ملف_البيانات, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.send(البيانات);
        } else {
            res.status(404).send('البيانات غير موجودة');
        }
    } catch (error) {
        res.status(500).send('خطأ');
    }
});

// ===== 7. تشغيل السيرفر =====

app.listen(المنفذ, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${المنفذ}`);
    console.log(`📁 ملف البيانات: ${ملف_البيانات}`);
    console.log(`🔗 webhook: http://localhost:${المنفذ}/webhook`);
    
    // إنشاء ملف بيانات افتراضي
    if (!fs.existsSync(ملف_البيانات)) {
        const بيانات_افتراضية = {
            cartoons: [
                {
                    name: 'ون بيس',
                    emoji: '🏴‍☠️',
                    description: 'مغامرات قراصنة قبعة القش',
                    seasons: [
                        {
                            number: 1,
                            description: 'موسم الشرق الأزرق',
                            episodes: [
                                {
                                    number: 1,
                                    title: 'أنا لوفي، سأصبح ملك القراصنة!',
                                    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        fs.writeFileSync(ملف_البيانات, JSON.stringify(بيانات_افتراضية, null, 2));
        console.log('📝 تم إنشاء ملف بيانات افتراضي');
    }
});

// ===== 8. تعيين Webhook (اختياري) =====
// async function تعيين_Webhook() {
//     const رابط_webhook = 'https://your-server.com/webhook';
//     const response = await fetch(`${رابط_تيليجرام}/setWebhook`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ url: رابط_webhook })
//     });
//     const البيانات = await response.json();
//     console.log(البيانات.ok ? '✅ تم تعيين Webhook' : '⚠️ فشل التعيين');
// }
// تعيين_Webhook();

console.log('🎬 بوت ديف كرتون جاهز!');
console.log('📝 ضع توكن البوت ومعرف الدردشة في أعلى الملف');