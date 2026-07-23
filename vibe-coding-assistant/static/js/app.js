// Frontend logic for the Vibe Coding Assistant.
// Handles tab switching, calling the /api/* endpoints, rendering results,
// and the shared "artifact" drawer (used for long text / code outputs).

const TABS = [
  { id: "style", label: "1. تحسين الأسلوب الكتابي" },
  { id: "voice", label: "2. تطوير الصوت الكتابي" },
  { id: "brainstorm", label: "3. العصف الذهني" },
  { id: "simplify", label: "4. تبسيط المفاهيم" },
  { id: "exam", label: "5. التحضير للاختبارات" },
  { id: "codeexplain", label: "6. شرح مفاهيم البرمجة" },
  { id: "codereview", label: "7. مراجعة الكود" },
  { id: "casestudy", label: "8. كتابة دراسة حالة" },
  { id: "funding", label: "9. كتابة طلبات التمويل" },
  { id: "chat", label: "10. البرمجة التشاركية" },
];

let sessionId = null;

// ---------- small generic helpers ----------

function $(id) {
  return document.getElementById(id);
}

/** Escape text before inserting it into innerHTML, to avoid XSS from echoed user input. */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.json()).detail || `طلب فشل (${res.status})`);
  }
  return res.json();
}

async function postForm(url, formData) {
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error((await res.json()).detail || `طلب فشل (${res.status})`);
  }
  return res.json();
}

function renderTable(rows, columns) {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join("")}</tr>`
    )
    .join("");
  return `<table class="result-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderList(items) {
  return `<ul class="list-disc pr-5 space-y-1">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function artifactButton(label, title, content) {
  const safeTitle = escapeHtml(title);
  const encoded = encodeURIComponent(content);
  return `<button class="btn-secondary mt-2" data-artifact-title="${safeTitle}" data-artifact-content="${encoded}">${escapeHtml(label)}</button>`;
}

// ---------- artifact drawer ----------

function openArtifact(title, content) {
  $("artifact-title").textContent = title;
  $("artifact-content").textContent = content;
  $("artifact-drawer").classList.add("open");
  $("artifact-overlay").classList.remove("hidden");
}

function closeArtifact() {
  $("artifact-drawer").classList.remove("open");
  $("artifact-overlay").classList.add("hidden");
}

// Delegate clicks on any dynamically-rendered "open as artifact" button.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-artifact-content]");
  if (trigger) {
    openArtifact(
      trigger.dataset.artifactTitle,
      decodeURIComponent(trigger.dataset.artifactContent)
    );
  }
});

$("artifact-close").addEventListener("click", closeArtifact);
$("artifact-overlay").addEventListener("click", closeArtifact);
$("artifact-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("artifact-content").textContent);
  const btn = $("artifact-copy");
  const original = btn.textContent;
  btn.textContent = "تم النسخ!";
  setTimeout(() => (btn.textContent = original), 1200);
});

// ---------- tab navigation ----------

function buildNav() {
  const list = $("tab-list");
  TABS.forEach((tab, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "nav-item" + (index === 0 ? " active" : "");
    button.textContent = tab.label;
    button.dataset.tab = tab.id;
    button.addEventListener("click", () => switchTab(tab.id));
    li.appendChild(button);
    list.appendChild(li);
  });
}

function switchTab(tabId) {
  TABS.forEach((tab) => {
    $(`panel-${tab.id}`).classList.toggle("hidden", tab.id !== tabId);
  });
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tabId);
  });
}

// ---------- per-feature error/loading UX ----------

function withLoading(button, resultEl, task) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "جارٍ المعالجة...";
  resultEl.innerHTML = "";
  task()
    .catch((err) => {
      resultEl.innerHTML = `<p class="text-red-600">حدث خطأ: ${escapeHtml(err.message)}</p>`;
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = originalText;
    });
}

// ---------- feature 1: improve writing style ----------

function bindStyle() {
  const button = document.querySelector('[data-action="style-submit"]');
  const resultEl = $("style-result");
  button.addEventListener("click", () => {
    const text = $("style-text").value.trim();
    const audience = $("style-audience").value;
    if (!text) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/style/improve", { text, audience });
      resultEl.innerHTML =
        `<h4 class="font-semibold mb-2">النص المحسّن</h4>` +
        artifactButton("عرض كنافذة (Artifact)", "النص المحسّن", data.improved_text) +
        `<h4 class="font-semibold mt-4 mb-2">جدول التعديلات</h4>` +
        renderTable(data.changes, [
          { key: "original", label: "العنصر الأصلي" },
          { key: "revised", label: "التعديل" },
          { key: "reason", label: "السبب" },
        ]);
    });
  });
}

// ---------- feature 2: develop writing voice ----------

function bindVoice() {
  const button = document.querySelector('[data-action="voice-submit"]');
  const resultEl = $("voice-result");
  button.addEventListener("click", () => {
    const files = $("voice-files").files;
    const rawText = $("voice-rawtext").value.trim();
    if (files.length === 0 && !rawText) return;
    withLoading(button, resultEl, async () => {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      formData.append("raw_text", rawText);
      const data = await postForm("/api/voice/build-guide", formData);
      resultEl.innerHTML =
        `<h4 class="font-semibold mb-2">دليل الأسلوب</h4>` + renderList(data.style_guide);
    });
  });
}

// ---------- feature 3: brainstorming ----------

function bindBrainstorm() {
  const button = document.querySelector('[data-action="brainstorm-submit"]');
  const resultEl = $("brainstorm-result");
  button.addEventListener("click", () => {
    const topic = $("brainstorm-topic").value.trim();
    const count = parseInt($("brainstorm-count").value, 10) || 5;
    if (!topic) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/brainstorm", { topic, count });
      resultEl.innerHTML = renderTable(data.ideas, [
        { key: "rank", label: "#" },
        { key: "idea", label: "الفكرة" },
        { key: "why_it_works", label: "لماذا تنجح" },
      ]);
    });
  });
}

// ---------- feature 4: simplify concepts ----------

function bindSimplify() {
  const button = document.querySelector('[data-action="simplify-submit"]');
  const resultEl = $("simplify-result");
  button.addEventListener("click", () => {
    const term = $("simplify-term").value.trim();
    const level = $("simplify-level").value;
    if (!term) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/simplify", { term, level });
      resultEl.innerHTML =
        `<p class="mb-3 whitespace-pre-wrap">${escapeHtml(data.explanation)}</p>` +
        `<h4 class="font-semibold mb-2">أمثلة</h4>` +
        renderList(data.examples);
    });
  });
}

// ---------- feature 5: exam / interview prep ----------

function bindExam() {
  const button = document.querySelector('[data-action="exam-submit"]');
  const resultEl = $("exam-result");
  button.addEventListener("click", () => {
    const subject = $("exam-subject").value.trim();
    if (!subject) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/exam-prep", { subject });
      resultEl.innerHTML =
        `<h4 class="font-semibold mb-2">خطة الدراسة</h4>` +
        renderTable(data.study_plan, [
          { key: "day", label: "اليوم" },
          { key: "focus", label: "المحور" },
          { key: "task", label: "المهمة" },
        ]) +
        `<h4 class="font-semibold mt-4 mb-2">أسئلة تدريبية</h4>` +
        renderList(data.practice_questions);
    });
  });
}

// ---------- feature 6: explain programming concepts ----------

function bindCodeExplain() {
  const button = document.querySelector('[data-action="codeexplain-submit"]');
  const resultEl = $("codeexplain-result");
  button.addEventListener("click", () => {
    const concept = $("codeexplain-concept").value.trim();
    const language = $("codeexplain-language").value.trim() || "Python";
    if (!concept) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/code/explain", { concept, language });
      resultEl.innerHTML =
        `<p class="mb-3 whitespace-pre-wrap">${escapeHtml(data.explanation)}</p>` +
        artifactButton("عرض الكود كنافذة (Artifact)", `مثال: ${concept}`, data.code);
    });
  });
}

// ---------- feature 7: code review ----------

function bindCodeReview() {
  const button = document.querySelector('[data-action="codereview-submit"]');
  const resultEl = $("codereview-result");
  button.addEventListener("click", () => {
    const code = $("codereview-code").value;
    const file = $("codereview-file").files[0];
    if (!code.trim() && !file) return;
    withLoading(button, resultEl, async () => {
      const formData = new FormData();
      formData.append("code", code);
      if (file) formData.append("file", file);
      const data = await postForm("/api/code/review", formData);
      resultEl.innerHTML =
        `<h4 class="font-semibold mb-2">المشاكل المكتشفة</h4>` +
        renderTable(data.issues, [
          { key: "severity", label: "الخطورة" },
          { key: "issue", label: "المشكلة" },
          { key: "suggestion", label: "الاقتراح" },
        ]) +
        artifactButton("عرض الكود المحسّن كنافذة (Artifact)", "الكود المحسّن", data.improved_code);
    });
  });
}

// ---------- feature 8: case study ----------

function bindCaseStudy() {
  const button = document.querySelector('[data-action="casestudy-submit"]');
  const resultEl = $("casestudy-result");
  button.addEventListener("click", () => {
    const data_ = $("casestudy-data").value.trim();
    if (!data_) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/case-study", { data: data_ });
      resultEl.innerHTML = artifactButton("عرض التقرير كنافذة (Artifact)", "دراسة الحالة", data.report);
    });
  });
}

// ---------- feature 9: funding request ----------

function bindFunding() {
  const button = document.querySelector('[data-action="funding-submit"]');
  const resultEl = $("funding-result");
  button.addEventListener("click", () => {
    const idea = $("funding-idea").value.trim();
    const budget = $("funding-budget").value.trim();
    if (!idea || !budget) return;
    withLoading(button, resultEl, async () => {
      const data = await postJSON("/api/funding", { idea, budget });
      resultEl.innerHTML = artifactButton("عرض المسودة كنافذة (Artifact)", "طلب التمويل", data.draft);
    });
  });
}

// ---------- feature 10: pair programming chat ----------

function appendChatBubble(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-bubble ${role}`;
  wrapper.textContent = text;
  $("chat-window").appendChild(wrapper);
  $("chat-window").scrollTop = $("chat-window").scrollHeight;
}

function bindChat() {
  const button = document.querySelector('[data-action="chat-submit"]');
  const input = $("chat-input");

  async function send() {
    const message = input.value.trim();
    if (!message) return;
    appendChatBubble("user", message);
    input.value = "";
    button.disabled = true;
    try {
      const data = await postJSON("/api/chat", { message, session_id: sessionId });
      sessionId = data.session_id;
      appendChatBubble("assistant", `${data.reply}\n\n${data.code}`);
    } catch (err) {
      appendChatBubble("assistant", `حدث خطأ: ${err.message}`);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", send);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") send();
  });
}

// ---------- boot ----------

async function initSession() {
  try {
    const data = await postJSONlessGet("/api/session/new");
    sessionId = data.session_id;
  } catch (_err) {
    // Non-fatal: the chat endpoint can create a session itself on first message.
  }
}

async function postJSONlessGet(url) {
  const res = await fetch(url);
  return res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  buildNav();
  bindStyle();
  bindVoice();
  bindBrainstorm();
  bindSimplify();
  bindExam();
  bindCodeExplain();
  bindCodeReview();
  bindCaseStudy();
  bindFunding();
  bindChat();
  initSession();
});
