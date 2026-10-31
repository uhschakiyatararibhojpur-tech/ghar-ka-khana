घर का खाना — वेबसाइट + Supabase बैकएंड
======================================

यह शुरुआती प्रोजेक्ट मोबाइल और कंप्यूटर दोनों पर चलता है। भाषा आसान हिंदी रखी गई है।
व्यवसाय सेटिंग: डिलीवरी क्षेत्र पीरो, भोजपुर, बिहार; मालिक मोबाइल/WhatsApp 8002068592; ऑर्डर डैशबोर्ड में सेव होंगे और ग्राहक के लिए WhatsApp पर ऑर्डर विवरण भेजने का बटन दिखेगा। भुगतान डिलीवरी पर नकद या UPI है।
ग्राहक नाश्ता / दोपहर / रात का खाना चुनकर ऑर्डर कर सकते हैं। अभी भुगतान खाना मिलने पर नकद (COD) है।
मालिक admin.html पर लॉगिन करके ऑर्डर देख सकते हैं, उनका स्टेटस बदल सकते हैं और मेन्यू में खाना जोड़ सकते हैं।

पहले से शामिल:
- ग्राहक वेबसाइट: index.html
- मालिक डैशबोर्ड: admin.html
- Supabase SQL: supabase/schema.sql
- सुरक्षित ऑर्डर Edge Function: supabase/functions/create-order/index.ts
- मोबाइल-फ्रेंडली डिज़ाइन
- सर्वर पर कीमत की दोबारा जाँच; ग्राहक के ब्राउज़र से भेजी कीमत पर भरोसा नहीं

सेटअप — एक-एक करके करें
-----------------------
1. https://supabase.com पर नया Project बनाएँ।
2. Supabase Dashboard -> SQL Editor -> New query खोलें।
3. supabase/schema.sql की पूरी सामग्री पेस्ट करके RUN करें।
4. Project Settings -> API में Project URL और anon/public key कॉपी करें।
5. config.js खोलें और SUPABASE_URL तथा SUPABASE_ANON_KEY में अपनी जानकारी भरें।
   ध्यान दें: service_role key कभी config.js या वेबसाइट में न डालें।
6. कंप्यूटर में Supabase CLI इंस्टॉल करें और अपने project से login/link करें।
7. इस प्रोजेक्ट के root folder से Edge Function deploy करें:
   supabase functions deploy create-order
   (CLI पहले से install और project link होना चाहिए।)
8. Supabase Dashboard -> Authentication -> Users में मालिक का ईमेल user बनाएँ।
   मजबूत पासवर्ड रखें। ग्राहक के लिए account की ज़रूरत नहीं है।
9. index.html खोलकर परीक्षण करें। असली वेबसाइट होस्ट करने के लिए पूरी folder को Netlify / Cloudflare Pages / GitHub Pages पर upload करें।
10. admin.html खोलकर मालिक के ईमेल-पासवर्ड से लॉगिन करें।

जरूरी बदलाव
------------
- config.js में अभी BUSINESS_PHONE 8002068592, WHATSAPP_NUMBER 918002068592 और DELIVERY_AREA पीरो, भोजपुर, बिहार सेट हैं। यदि नंबर/क्षेत्र बदलें तो यहीं बदलें।
- ग्राहक को दिखने वाले खाने/कीमत को मालिक dashboard से जोड़ें। शुरुआती sample menu भी SQL में डाला गया है।
- अभी delivery charge नहीं जोड़ा गया है; शुरुआत में फोन पर पुष्टि करके बताएँ।
- अभी भुगतान डिलीवरी पर नकद या UPI है। ऑनलाइन UPI payment gateway शामिल नहीं है। ग्राहक का ऑर्डर पहले Supabase में सेव होता है; फिर ग्राहक WhatsApp पर ऑर्डर विवरण भेजने के बटन को दबाता है।
- delivery area, delivery time, minimum order, छुट्टी/मेन्यू बंद करने का नियम ग्राहक से पक्का करके वेबसाइट पर लिखें।
- वास्तविक ग्राहक डेटा संभालते समय मोबाइल/पते को निजी रखें; dashboard password साझा न करें।

सुरक्षा नोट
-----------
- Supabase anon key सार्वजनिक वेबसाइट में होना सामान्य है; RLS policies सुरक्षा देती हैं।
- service_role key केवल Supabase Edge Function के server environment में रहती है।
- यह MVP है। बड़े स्तर पर शुरू करने से पहले rate limiting, spam protection (captcha), backup और privacy policy जोड़ें।
- Admin role अभी Supabase Auth में authenticated users तक सीमित है। इस project में केवल मालिक का user बनाएँ; किसी अनजान व्यक्ति को Auth user न दें।
- Status update तथा menu management के लिए authenticated user को अनुमति है। एक ही owner account रखें।

बाद में ऐप में बदलना
--------------------
यह frontend API आधारित है। बाद में Android ऐप / PWA बनाया जा सकता है। पहले वेबसाइट पर वास्तविक ऑर्डर flow, मेन्यू और delivery क्षेत्र का परीक्षण करें।

सपोर्ट के लिए जरूरी जानकारी
---------------------------
तैनाती से पहले मालिक से ये बातें पूछें:
1. डिलीवरी किस शहर/गाँव और कितने किलोमीटर तक?
2. ऑर्डर फोन/WhatsApp पर भी चाहिए या सिर्फ डैशबोर्ड?
3. नाश्ता, लंच और डिनर का ऑर्डर कितने बजे तक लेना है?
4. डिलीवरी शुल्क और न्यूनतम ऑर्डर कितना होगा?
5. मालिक का फोन/WhatsApp नंबर क्या है?

इस अपडेट में WhatsApp संदेश ग्राहक के क्लिक से भेजा जाता है; यह WhatsApp Business API का automatic server-side message नहीं है। ग्राहक के क्लिक के बाद WhatsApp खुलता है और संदेश भेजने की पुष्टि ग्राहक करता है।
