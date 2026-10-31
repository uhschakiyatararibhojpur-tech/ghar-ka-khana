घर का खाना — Google Sheets सेटअप

1. config.js में GOOGLE_SCRIPT_URL में Apps Script का Web App URL डालें।
2. config.js में GOOGLE_SHEET_URL में अपनी Google Sheet का लिंक डालें।
3. GitHub repository में config.js, app.js और admin.html को नए versions से replace करें।
4. Google Sheet को Private रखें; केवल मालिक के Google account को access दें।
5. टेस्ट ऑर्डर देकर Orders tab में जाँचें।

महत्वपूर्ण: static GitHub Pages साइट Apps Script से no-cors POST भेजती है, इसलिए वेबसाइट server response पढ़कर सेव होने की पुष्टि नहीं कर सकती। हर टेस्ट ऑर्डर के बाद Google Sheet में जाँचें। WhatsApp संदेश ग्राहक के क्लिक करने पर खुलेगा; यह automatic WhatsApp API नहीं है।

यह सरल Google Sheets आधारित संस्करण है। ऑर्डर स्टेटस Google Sheet में manually बदलें।
