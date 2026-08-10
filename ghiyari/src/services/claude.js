// ════════════════════════════════════════════
// 🤖  CLAUDE AI SERVICE
// ════════════════════════════════════════════
export const callGhiyariAI = async (history, lang) => {
  const system = `You are Ghiyari AI — an expert assistant for UAE auto spare parts marketplace.
${lang==="ar" ? "CRITICAL: Always respond in Arabic (عربي فصيح بسيط)." : "CRITICAL: Always respond in English."}

You are knowledgeable about:
- Tires, brakes, batteries for Toyota, Nissan, Lexus, BMW, Mercedes
- UAE market pricing in AED, typical maintenance schedules
- Part compatibility, specifications, quality differences (OEM vs aftermarket)
- Dubai/Abu Dhabi/Sharjah service locations

Current Inventory:
• Toyota Camry Tire 225/55R17 → 450 AED (Bestseller)
• Lexus ES350 Battery 65Ah → 680 AED (Premium)
• Nissan Patrol Brakes Ventilated → 320 AED (Bestseller)
• BMW 5 Series Tire 245/45R18 → 750 AED (Premium)
• Toyota Land Cruiser Battery 80Ah → 520 AED
• Mercedes C300 Front Brakes Ceramic → 580 AED

Be concise (3-5 lines max), helpful, and professional. End with a relevant product recommendation when appropriate.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      system,
      messages: history.map(m=>({role:m.role, content:m.content}))
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0]?.text || (lang==="ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred.");
};
