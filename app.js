(() => {
  "use strict";

  const cfg = window.GHK_CONFIG || {};
  const endpoint = String(cfg.GOOGLE_SCRIPT_URL || "").trim();

  const menu = [
    { id: "d1", name: "लिट्टी-चोखा", description: "बिहार का मशहूर देसी स्वाद", price: 60, meal_type: "lunch", emoji: "🥘" },
    { id: "d2", name: "दाल-भात-आलू भुजिया", description: "सादा, स्वादिष्ट और पेट भर भोजन", price: 80, meal_type: "lunch", emoji: "🍛" },
    { id: "d3", name: "रोटी-सब्ज़ी-दाल", description: "घर जैसा रोज़ का खाना", price: 90, meal_type: "dinner", emoji: "🍲" },
    { id: "d4", name: "चूड़ा-दही", description: "हल्का और स्वादिष्ट बिहारी नाश्ता", price: 40, meal_type: "breakfast", emoji: "🥣" },
    { id: "d5", name: "सत्तू पराठा", description: "देसी सत्तू से बना भरपेट नाश्ता", price: 50, meal_type: "breakfast", emoji: "🫓" },
    { id: "d6", name: "पूड़ी-सब्ज़ी", description: "गरमा-गरम नाश्ता या भोजन", price: 60, meal_type: "breakfast", emoji: "🍽️" }
  ];

  let cart = {};
  let activeMeal = "all";

  const $ = s => document.querySelector(s);
  const money = n => "₹" + Number(n).toLocaleString("en-IN");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function renderMenu() {
    const items = menu.filter(x =>
      activeMeal === "all" || x.meal_type === activeMeal
    );

    $("#menuGrid").innerHTML = items.map(x => `
      <article class="food-card">
        <div class="food-visual">${escapeHtml(x.emoji)}</div>
        <div class="food-info">
          <h3>${escapeHtml(x.name)}</h3>
          <p>${escapeHtml(x.description)}</p>
          <div class="food-bottom">
            <span class="price">${money(x.price)}</span>
            <button class="add-btn" data-add="${x.id}">＋ टोकरी में</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  function total() {
    return menu.reduce((sum, x) =>
      sum + (cart[x.id] || 0) * x.price, 0
    );
  }

  function renderCart() {
    const items = menu.filter(x => cart[x.id]);

    $("#cartCount").textContent =
      items.reduce((sum, x) => sum + cart[x.id], 0);

    $("#cartTotal").textContent = money(total());

    $("#cartItems").innerHTML = items.length
      ? items.map(x => `
        <div class="cart-row">
          <div>
            <strong>${escapeHtml(x.name)}</strong>
            <small>${money(x.price)} × ${cart[x.id]}</small>
          </div>
          <div class="qty">
            <button data-change="${x.id}" data-n="-1">−</button>
            <b>${cart[x.id]}</b>
            <button data-change="${x.id}" data-n="1">＋</button>
          </div>
        </div>
      `).join("")
      : '<p class="empty">अभी टोकरी खाली है।<br>मेन्यू से खाना चुनें।</p>';
  }

  function openCart() {
    $("#overlay").classList.add("show");
    $("#cartDrawer").classList.add("open");
  }

  function closeCart() {
    $("#overlay").classList.remove("show");
    $("#cartDrawer").classList.remove("open");
  }

  function showMessage(message, color = "#a33") {
    const el = $("#formMessage");
    el.textContent = message;
    el.style.color = color;
  }

  function whatsappLink(order) {
    const number = String(cfg.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    if (!number) return "";

    const lines = order.items.map(x =>
      `• ${x.name} × ${x.quantity} = ${money(x.price * x.quantity)}`
    ).join("\n");

    const message = [
      "नमस्ते! घर का खाना में नया ऑर्डर है।",
      `नाम: ${order.name}`,
      `मोबाइल: ${order.phone}`,
      `पता: ${order.address}`,
      `समय: ${order.mealTime}`,
      `भुगतान: ${order.paymentMethod}`,
      lines,
      `कुल: ${money(order.total)}`,
      `नोट: ${order.note || "नहीं"}`
    ].join("\n");

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  async function submitOrder(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = $("#placeOrder");

    if (!Object.keys(cart).length) {
      showMessage("पहले टोकरी में खाना चुनें।");
      return;
    }

    if (!endpoint || !endpoint.startsWith("https://script.google.com/macros/s/")) {
      showMessage("Google Sheets की सेटिंग सही नहीं है।");
      return;
    }

    const fd = new FormData(form);

    const order = {
      name: String(fd.get("customer_name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      items: menu.filter(x => cart[x.id]).map(x => ({
        name: x.name,
        price: Number(x.price),
        quantity: cart[x.id]
      })),
      total: total(),
      paymentMethod: fd.get("payment_method") === "upi_on_delivery"
        ? "UPI on Delivery" : "Cash on Delivery",
      mealTime: String(fd.get("meal_time") || ""),
      note: String(fd.get("note") || "").trim()
    };

    if (!order.name || !/^[6-9]\d{9}$/.test(order.phone) || !order.address) {
      showMessage("कृपया नाम, सही मोबाइल नंबर और पूरा पता भरें।");
      return;
    }

    button.disabled = true;
    button.textContent = "ऑर्डर भेजा जा रहा है…";
    showMessage("", "#287344");

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(order)
      });

      const url = whatsappLink(order);
      const msg = $("#formMessage");

      msg.textContent =
        "ऑर्डर भेजने का अनुरोध किया गया है। कृपया WhatsApp पर मालिक को जानकारी भेजें। Google Sheet में ऑर्डर सेव होने की जाँच करें।";

      msg.style.color = "#287344";

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.className = "btn primary";
        link.style.marginTop = "10px";
        link.textContent = "WhatsApp पर ऑर्डर भेजें";
        msg.appendChild(document.createElement("br"));
        msg.appendChild(link);
      }

      cart = {};
      renderCart();
      form.reset();

      button.disabled = false;
      button.textContent = "ऑर्डर भेजें";

      toast("अनुरोध भेज दिया गया — शीट में जाँचें");

    } catch (error) {
      console.error(error);
      showMessage("ऑर्डर नहीं जा सका। इंटरनेट जाँचें या फोन करें।");
      button.disabled = false;
      button.textContent = "दोबारा कोशिश करें";
    }
  }

  function init() {
    $("#mealTabs").addEventListener("click", e => {
      const tab = e.target.closest("[data-meal]");
      if (!tab) return;

      activeMeal = tab.dataset.meal;

      document.querySelectorAll(".tab").forEach(x =>
        x.classList.toggle("active", x === tab)
      );

      renderMenu();
    });

    $("#menuGrid").addEventListener("click", e => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;

      const id = btn.dataset.add;
      if (!menu.some(x => x.id === id)) return;

      cart[id] = (cart[id] || 0) + 1;
      renderCart();
      toast("खाना टोकरी में जुड़ गया");
    });

    $("#cartItems").addEventListener("click", e => {
      const btn = e.target.closest("[data-change]");
      if (!btn) return;

      const id = btn.dataset.change;
      cart[id] = (cart[id] || 0) + Number(btn.dataset.n);

      if (cart[id] <= 0) delete cart[id];

      renderCart();
    });

    $("#cartOpen").onclick = openCart;
    $("#cartClose").onclick = closeCart;
    $("#overlay").onclick = closeCart;

    $("#checkoutOpen").onclick = () => {
      if (!Object.keys(cart).length) {
        toast("पहले टोकरी में खाना चुनें");
        return;
      }

      closeCart();
      $("#checkoutModal").classList.add("show");
    };

    $("#checkoutClose").onclick = () =>
      $("#checkoutModal").classList.remove("show");

    $("#checkoutModal").addEventListener("click", e => {
      if (e.target.id === "checkoutModal") {
        e.currentTarget.classList.remove("show");
      }
    });

    $("#checkoutForm").addEventListener("submit", submitOrder);

    $("#year").textContent = new Date().getFullYear();

    if (cfg.BUSINESS_PHONE) {
      $("#footerContact").innerHTML =
        `पीरो में ऑर्डर के लिए कॉल / WhatsApp करें:
        <a style="color:#ffd39e"
        href="tel:${encodeURIComponent(cfg.BUSINESS_PHONE)}">
        ${escapeHtml(cfg.BUSINESS_PHONE)}</a>`;
    }

    renderMenu();
    renderCart();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
