(() => {
  const PIRO_LAT = 25.3314;
  const PIRO_LNG = 84.4031;
  const DELIVERY_RADIUS = 3000;

  let locationVerified = false;

  const button = document.getElementById("checkLocation");
  const message = document.getElementById("locationMessage");
  const form = document.getElementById("checkoutForm");

  if (!button || !message || !form) return;

  function distanceInMetres(lat1, lon1, lat2, lon2) {
    const toRad = value => value * Math.PI / 180;
    const earthRadius = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  button.addEventListener("click", () => {
    if (!navigator.geolocation) {
      message.textContent = "आपके ब्राउज़र में लोकेशन सुविधा उपलब्ध नहीं है।";
      return;
    }

    locationVerified = false;
    button.disabled = true;
    button.textContent = "लोकेशन जाँची जा रही है…";
    message.textContent = "कृपया लोकेशन की अनुमति दें।";

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > 1000) {
          message.textContent =
            "लोकेशन साफ़ नहीं मिल रही है। कृपया खुले स्थान पर दोबारा कोशिश करें।";
          button.disabled = false;
          button.textContent = "📍 दोबारा लोकेशन जाँचें";
          return;
        }

        const distance = distanceInMetres(
          PIRO_LAT, PIRO_LNG, latitude, longitude
        );

        if (distance <= DELIVERY_RADIUS) {
          locationVerified = true;
          message.textContent =
            "✅ आपकी लोकेशन डिलीवरी क्षेत्र में है। आप ऑर्डर कर सकते हैं।";
        } else {
          message.textContent =
            "❌ माफ़ कीजिए! अभी आपकी लोकेशन हमारी 3 km डिलीवरी सीमा से बाहर है।";
        }

        button.disabled = false;
        button.textContent = "📍 लोकेशन दोबारा जाँचें";
      },
      error => {
        const errors = {
          1: "लोकेशन की अनुमति दें, तभी हम डिलीवरी जाँच पाएँगे।",
          2: "आपकी लोकेशन नहीं मिल सकी। दोबारा कोशिश करें।",
          3: "लोकेशन जाँच में समय लगा। दोबारा कोशिश करें।"
        };

        message.textContent = errors[error.code] || "लोकेशन जाँच नहीं हो सकी।";
        button.disabled = false;
        button.textContent = "📍 दोबारा लोकेशन जाँचें";
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  });

  form.addEventListener("submit", event => {
    if (!locationVerified) {
      event.preventDefault();
      event.stopImmediatePropagation();
      message.textContent =
        "⚠️ पहले अपनी लोकेशन जाँचें।";
    }
  }, true);
})();
