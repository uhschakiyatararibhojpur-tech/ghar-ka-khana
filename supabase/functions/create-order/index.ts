import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    const name = String(body.customer_name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const note = String(body.note || "").trim().slice(0, 300);
    const mealTime = String(body.meal_time || "").slice(0, 60);
    const paymentMethod = String(body.payment_method || "cash_on_delivery");
    if (!["cash_on_delivery", "upi_on_delivery"].includes(paymentMethod)) throw new Error("कृपया भुगतान का सही तरीका चुनें।");
    if (name.length < 2 || name.length > 80) throw new Error("कृपया सही नाम लिखें।");
    if (!/^[6-9][0-9]{9}$/.test(phone)) throw new Error("कृपया 10 अंकों का मोबाइल नंबर लिखें।");
    if (address.length < 8 || address.length > 500) throw new Error("कृपया पूरा पता लिखें।");
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) throw new Error("खाने की सूची सही नहीं है।");

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);
    const ids = [...new Set(body.items.map((i: any) => String(i.menu_item_id || "")))];
    if (ids.some((id: string) => !/^[0-9a-f-]{36}$/i.test(id))) throw new Error("मेन्यू में कोई समस्या है। पेज रिफ्रेश करें।");
    const { data: menu, error: menuErr } = await admin.from("menu_items").select("id,name,price,is_available").in("id", ids);
    if (menuErr || !menu) throw new Error("मेन्यू अभी उपलब्ध नहीं है।");
    const normalized = body.items.map((item: any) => {
      const m = menu.find((x: any) => x.id === item.menu_item_id);
      const qty = Number(item.quantity);
      if (!m || !m.is_available || !Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error("चुना हुआ खाना अभी उपलब्ध नहीं है।");
      return { menu_item_id: m.id, name: m.name, price: Number(m.price), quantity: qty };
    });
    const total = normalized.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    if (total <= 0 || total > 100000) throw new Error("ऑर्डर की रकम सही नहीं है।");
    const { data: order, error: orderErr } = await admin.from("orders").insert({
      customer_name: name, phone, address, meal_time: mealTime, note, total,
      payment_method: paymentMethod, status: "new"
    }).select("id").single();
    if (orderErr || !order) throw new Error("ऑर्डर सेव नहीं हो पाया।");
    const { error: itemsErr } = await admin.from("order_items").insert(normalized.map((item: any) => ({ ...item, order_id: order.id })));
    if (itemsErr) {
      await admin.from("orders").delete().eq("id", order.id);
      throw new Error("ऑर्डर की जानकारी सेव नहीं हो पाई।");
    }
    return new Response(JSON.stringify({ success: true, order_id: order.id, total }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "कुछ गड़बड़ हो गई।" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});