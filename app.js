const cfg = window.GHK_CONFIG || {};
const ready = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
const sb = ready && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
const defaults = [
 {id:"d1",name:"लिट्टी-चोखा",description:"बिहार का मशहूर देसी स्वाद",price:60,meal_type:"lunch",emoji:"🥘"},
 {id:"d2",name:"दाल-भात-आलू भुजिया",description:"सादा, स्वादिष्ट और पेट भर भोजन",price:80,meal_type:"lunch",emoji:"🍛"},
 {id:"d3",name:"रोटी-सब्ज़ी-दाल",description:"घर जैसा रोज़ का खाना",price:90,meal_type:"dinner",emoji:"🍲"},
 {id:"d4",name:"चूड़ा-दही",description:"हल्का और स्वादिष्ट बिहारी नाश्ता",price:40,meal_type:"breakfast",emoji:"🥣"},
 {id:"d5",name:"सत्तू पराठा",description:"देसी सत्तू से बना भरपेट नाश्ता",price:50,meal_type:"breakfast",emoji:"🫓"},
 {id:"d6",name:"पूड़ी-सब्ज़ी",description:"गरमा-गरम नाश्ता या भोजन",price:60,meal_type:"breakfast",emoji:"🍽️"}
];
let menu = defaults, cart = {}, activeMeal = "all";
const $ = s => document.querySelector(s);
const money = n => "₹"+Number(n).toLocaleString("en-IN");
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function mealName(m){return ({breakfast:"🌅 नाश्ता",lunch:"☀️ दोपहर",dinner:"🌙 रात"})[m]||"खाना"}
async function loadMenu(){
 if(sb){const {data,error}=await sb.from("menu_items").select("id,name,description,price,meal_type,emoji,is_available").eq("is_available",true).order("sort_order");if(!error&&data&&data.length)menu=data;}
 renderMenu();
}
function renderMenu(){
 const list=menu.filter(x=>activeMeal==="all"||x.meal_type===activeMeal);
 $("#menuGrid").innerHTML=list.length?list.map(x=>`<article class="food-card"><div class="food-visual">${x.emoji||"🍱"}</div><div class="food-info"><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.description||"ताज़ा बना स्वादिष्ट खाना")}</p><div class="food-bottom"><span class="price">${money(x.price)}</span><button class="add-btn" data-add="${x.id}">＋ टोकरी में</button></div></div></article>`).join(""):'<p class="empty">इस समय इस तरह का खाना उपलब्ध नहीं है।</p>';
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function add(id){cart[id]=(cart[id]||0)+1;renderCart();toast("खाना टोकरी में जुड़ गया");}
function change(id,n){cart[id]=(cart[id]||0)+n;if(cart[id]<=0)delete cart[id];renderCart()}
function total(){return menu.reduce((s,x)=>s+(cart[x.id]||0)*Number(x.price),0)}
function renderCart(){
 const entries=menu.filter(x=>cart[x.id]);
 $("#cartCount").textContent=entries.reduce((s,x)=>s+cart[x.id],0);
 $("#cartTotal").textContent=money(total());
 $("#cartItems").innerHTML=entries.length?entries.map(x=>`<div class="cart-row"><div><strong>${escapeHtml(x.name)}</strong><small>${money(x.price)} × ${cart[x.id]}</small></div><div class="qty"><button data-change="${x.id}" data-n="-1">−</button><b>${cart[x.id]}</b><button data-change="${x.id}" data-n="1">＋</button></div></div>`).join(""):'<p class="empty">अभी टोकरी खाली है।<br>मेन्यू से खाना चुनें।</p>';
}
function openCart(){ $("#overlay").classList.add("show");$("#cartDrawer").classList.add("open");}
function closeCart(){ $("#overlay").classList.remove("show");$("#cartDrawer").classList.remove("open");}
$("#mealTabs").addEventListener("click",e=>{const b=e.target.closest("[data-meal]");if(!b)return;activeMeal=b.dataset.meal;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));renderMenu()});
$("#menuGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)add(b.dataset.add)});
$("#cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-change]");if(b)change(b.dataset.change,Number(b.dataset.n))});
$("#cartOpen").onclick=openCart;$("#cartClose").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#checkoutOpen").onclick=()=>{if(!Object.keys(cart).length){toast("पहले टोकरी में खाना चुनें");return;}closeCart();$("#checkoutModal").classList.add("show")};
$("#checkoutClose").onclick=()=>$("#checkoutModal").classList.remove("show");
$("#checkoutModal").addEventListener("click",e=>{if(e.target.id==="checkoutModal")e.currentTarget.classList.remove("show")});
$("#checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,btn=$("#placeOrder"),msg=$("#formMessage");if(!Object.keys(cart).length)return;
 if(!sb){msg.textContent="वेबसाइट अभी सेटअप नहीं हुई है। कृपया व्यवस्थापक से Supabase सेटअप पूरा करवाएँ।";msg.style.color="#a33";return;}
 const fd=new FormData(form);const items=menu.filter(x=>cart[x.id]).map(x=>({menu_item_id:x.id,name:x.name,price:Number(x.price),quantity:cart[x.id]}));
 const payload={customer_name:fd.get("customer_name").trim(),phone:fd.get("phone").trim(),address:fd.get("address").trim(),meal_time:fd.get("meal_time"),payment_method:fd.get("payment_method"),note:fd.get("note").trim(),items};
 btn.disabled=true;btn.textContent="ऑर्डर भेजा जा रहा है…";msg.textContent="";
 try{
  const {data,error}=await sb.functions.invoke("create-order",{body:payload});
  if(error)throw error;
  msg.style.color="#287344";
  const itemLines=items.map(i=>`• ${i.name} × ${i.quantity} = ${money(i.price*i.quantity)}`).join("\n");
  const payLabel=payload.payment_method==="upi_on_delivery"?"डिलीवरी पर UPI":"डिलीवरी पर नकद";
  const waText=`नमस्ते! घर का खाना में नया ऑर्डर है।\nऑर्डर ID: ${data.order_id}\nनाम: ${payload.customer_name}\nमोबाइल: ${payload.phone}\nपता: ${payload.address}\nसमय: ${payload.meal_time}\nभुगतान: ${payLabel}\n${itemLines}\nकुल: ${money(data.total)}\nनोट: ${payload.note||"नहीं"}`;
  const waNumber=(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"");
  const waUrl=waNumber?`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`:"";
  msg.innerHTML=`ऑर्डर मिल गया! आपका ऑर्डर डैशबोर्ड में सेव हो गया है। मालिक को WhatsApp पर जानकारी भेजने के लिए नीचे दबाएँ।${waUrl?`<br><a class="btn primary" style="margin-top:10px" target="_blank" rel="noopener" href="${waUrl}">WhatsApp पर ऑर्डर भेजें</a>`:""}`;
  cart={};renderCart();form.reset();btn.textContent="ऑर्डर भेजें";
  if(waUrl) { /* Customer deliberately taps WhatsApp link to send the order message. */ }
  setTimeout(()=>{toast("आपका ऑर्डर सफलतापूर्वक सेव हो गया");},300);
 }catch(err){console.error(err);msg.style.color="#a33";msg.textContent="ऑर्डर नहीं जा सका। इंटरनेट जाँचें या हमें फोन करें।";btn.disabled=false;btn.textContent="दोबारा कोशिश करें";}
});
$("#year").textContent=new Date().getFullYear();
if(cfg.BUSINESS_PHONE){$("#footerContact").innerHTML=`पीरो में ऑर्डर के लिए कॉल / WhatsApp करें: <a style="color:#ffd39e" href="tel:${encodeURIComponent(cfg.BUSINESS_PHONE)}">${escapeHtml(cfg.BUSINESS_PHONE)}</a>`;}
loadMenu();renderCart();