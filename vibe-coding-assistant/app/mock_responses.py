"""Mock ("fake but structured") answers for all 10 features.

Every function here returns believable, input-aware content without calling any
real AI model. Each one is a drop-in replacement target: swap the body of a
function for a real Claude API call whenever you're ready, and app/routers.py
does not need to change (the return shape is what matters).

  # >>> REPLACE-WITH-REAL-API: see app/config.py for the exact steps. <<<
"""
from typing import List


def improve_style(text: str, audience: str) -> dict:
    """Feature 1: rewrite `text` for `audience` and list what changed."""
    audience_labels = {
        "professional": "جمهور احترافي / رسمي",
        "casual": "جمهور عام / غير رسمي",
        "academic": "جمهور أكاديمي",
        "children": "جمهور من الأطفال",
    }
    label = audience_labels.get(audience, audience)
    improved = (
        f"[نسخة محسّنة موجّهة إلى: {label}]\n\n"
        f"{text.strip()}\n\n"
        "(تمت إعادة الصياغة هنا بشكل تجريبي — عند تفعيل API حقيقي سيظهر تحسين فعلي للنص.)"
    )
    changes = [
        {"original": "الجملة الافتتاحية", "revised": "أُعيدت صياغتها لتكون أكثر وضوحاً ومباشرة", "reason": "تحسين الانطباع الأول"},
        {"original": "المصطلحات المستخدمة", "revised": f"رُوجعت لتناسب {label}", "reason": "ملاءمة الجمهور المستهدف"},
        {"original": "طول الجمل", "revised": "قُسّمت الجمل الطويلة إلى جمل أقصر", "reason": "تحسين القابلية للقراءة"},
    ]
    return {"improved_text": improved, "changes": changes}


def build_voice_guide(combined_samples: str) -> dict:
    """Feature 2: derive a short style guide from uploaded/pasted writing samples."""
    sample_len = len(combined_samples.strip())
    guide_points = [
        "طول الجمل: يميل الأسلوب إلى جمل متوسطة الطول مع تنويع بسيط بين القصيرة والطويلة.",
        "المفردات: استخدام مباشر أكثر من الاعتماد على مصطلحات معقدة.",
        "النبرة العامة: نبرة مستخلصة تجريبياً من العينات المرفوعة.",
        "علامات الترقيم: استخدام معتدل للفواصل، مع جمل قصيرة للتأكيد عند الحاجة.",
        f"حجم العينة التي تم تحليلها: حوالي {sample_len} حرفاً.",
    ]
    return {"style_guide": guide_points}


def brainstorm_ideas(topic: str, count: int) -> dict:
    """Feature 3: return `count` ranked ideas about `topic`."""
    angles = [
        "زاوية عملية / تطبيقية", "زاوية إبداعية غير تقليدية", "زاوية موجهة للمبتدئين",
        "زاوية تقنية متقدمة", "زاوية تسويقية", "زاوية موفّرة للتكلفة",
        "زاوية نموذج أولي سريع (MVP)", "زاوية تعاونية / مجتمعية",
        "زاوية طويلة المدى", "زاوية مبنية على البيانات",
    ]
    ideas = []
    for i in range(count):
        angle = angles[i % len(angles)]
        ideas.append({
            "rank": i + 1,
            "idea": f"فكرة حول '{topic}' انطلاقاً من {angle}",
            "why_it_works": f"تستثمر {angle} لتقديم قيمة مختلفة ضمن موضوع '{topic}'.",
        })
    return {"topic": topic, "ideas": ideas}


def simplify_concept(term: str, level: str) -> dict:
    """Feature 4: explain `term` with a metaphor + examples, tuned to `level`."""
    levels = {"beginner": "مبتدئ", "intermediate": "متوسط", "expert": "خبير"}
    label = levels.get(level, level)
    explanation = (
        f"تخيّل أن '{term}' أشبه بموقف يومي مألوف تشرحه بأبسط شكل ممكن.\n\n"
        f"بمستوى '{label}': هذا شرح تجريبي يشبّه '{term}' باستعارة سهلة، "
        "ثم يربطها بمثال عملي واحد يوضح متى يُستخدم هذا المفهوم فعلياً."
    )
    examples = [
        f"مثال 1: {term} في سياق يومي بسيط.",
        f"مثال 2: {term} في سياق عملي/مهني.",
    ]
    return {"term": term, "level": label, "explanation": explanation, "examples": examples}


def build_exam_plan(subject: str) -> dict:
    """Feature 5: build a one-week study plan and a set of practice questions."""
    plan = [
        {"day": "اليوم 1-2", "focus": f"أساسيات {subject}", "task": "مراجعة المفاهيم الجوهرية وتدوين ملخص"},
        {"day": "اليوم 3-4", "focus": f"تطبيقات {subject}", "task": "حل تمارين/أسئلة تدريبية"},
        {"day": "اليوم 5", "focus": "مراجعة شاملة", "task": "اختبار تجريبي كامل تحت ضغط وقت"},
        {"day": "اليوم 6", "focus": "نقاط الضعف", "task": "التركيز على الأسئلة التي حصلت فيها على أخطاء"},
        {"day": "اليوم 7", "focus": "الجاهزية النهائية", "task": "راحة ذهنية ثم مراجعة سريعة للملخصات"},
    ]
    questions = [
        f"عرّف المفهوم الأساسي في {subject} بأسلوبك الخاص.",
        f"ما الفرق بين مفهومين متشابهين ضمن {subject}؟",
        f"صف موقفاً عملياً تُطبَّق فيه معرفتك بـ {subject}.",
        f"ما أكثر خطأ شائع يقع فيه المبتدئون في {subject}؟",
    ]
    return {"subject": subject, "study_plan": plan, "practice_questions": questions}


def _sample_snippet(concept: str, language: str) -> str:
    """Return a tiny runnable snippet illustrating `concept` in `language`."""
    lang = language.lower()
    if "python" in lang:
        return (
            f"# Example demonstrating: {concept}\n"
            "def example():\n"
            f"    # TODO: this illustrates '{concept}'\n"
            f"    print('Hello from {concept} example')\n\n"
            "example()"
        )
    if "javascript" in lang or lang == "js":
        return (
            f"// Example demonstrating: {concept}\n"
            "function example() {\n"
            f"  // TODO: this illustrates '{concept}'\n"
            f"  console.log('Hello from {concept} example');\n"
            "}\n"
            "example();"
        )
    return f"// Generic placeholder snippet for '{concept}' in {language}\n// Replace with a real example once connected to a live API."


def explain_code_concept(concept: str, language: str) -> dict:
    """Feature 6: explain a programming concept with a runnable code sample."""
    explanation = (
        f"'{concept}' في لغة {language} يُستخدم عادة عندما تحتاج إلى التعامل مع هذا النمط من المشاكل. "
        "(هذا شرح تجريبي مبسّط، والكود المرفق أدناه قابل للتجربة مباشرة.)"
    )
    return {"concept": concept, "language": language, "explanation": explanation, "code": _sample_snippet(concept, language)}


def review_code(code: str) -> dict:
    """Feature 7: flag a few common issues in `code` and return an 'improved' copy."""
    lines = code.splitlines()
    issues = []
    if any(len(line) > 100 for line in lines):
        issues.append({
            "severity": "منخفض",
            "issue": "توجد أسطر طويلة جداً (أكثر من 100 حرف).",
            "suggestion": "قسّم الأسطر الطويلة لتحسين القراءة.",
        })
    if "except:" in code:
        issues.append({
            "severity": "متوسط",
            "issue": "استخدام except: عام دون تحديد نوع الاستثناء.",
            "suggestion": "التقط أنواع استثناءات محددة بدلاً من except: العام.",
        })
    if not code.strip():
        issues.append({"severity": "معلومة", "issue": "لم يتم إدخال أي كود.", "suggestion": "الصق كوداً أو ارفع ملف .py."})
    if not issues:
        issues.append({
            "severity": "معلومة",
            "issue": "لم يُعثر على مشاكل واضحة في هذا الفحص التجريبي.",
            "suggestion": "فعّل الاتصال بـ API حقيقي للحصول على تحليل أعمق.",
        })
    improved_code = (
        "# --- النسخة المحسّنة (Mock) ---\n"
        f"{code}\n"
        "# TODO: التحسينات الحقيقية تظهر هنا بعد تفعيل الاتصال بـ API"
    )
    return {"issues": issues, "improved_code": improved_code}


def write_case_study(data: str) -> dict:
    """Feature 8: turn raw notes into a structured intro/challenges/solutions/results report."""
    report = (
        "## مقدمة\n"
        f"تتناول هذه الدراسة الحالة بناءً على المعطيات التالية:\n{data}\n\n"
        "## التحديات\n"
        "تحديات مستخلصة تجريبياً من المعطيات أعلاه.\n\n"
        "## الحلول\n"
        "حلول مقترحة تجريبياً بناءً على نمط المعطيات المُدخلة.\n\n"
        "## النتائج\n"
        "نتائج متوقعة يتم استخلاصها بشكل تجريبي من هذه الحالة."
    )
    return {"report": report}


def write_funding_request(idea: str, budget: str) -> dict:
    """Feature 9: draft a formal funding request document."""
    draft = (
        "# طلب تمويل مشروع\n\n"
        f"**فكرة المشروع:** {idea}\n\n"
        f"**الميزانية المطلوبة:** {budget}\n\n"
        "## الملخص التنفيذي\n"
        f"مسودة تجريبية توضح أهمية المشروع '{idea}' والقيمة المتوقعة منه.\n\n"
        "## الاستخدام المقترح للميزانية\n"
        f"توزيع تجريبي للميزانية ({budget}) على البنود الأساسية للمشروع.\n\n"
        "## الأثر المتوقع\n"
        "وصف تجريبي للأثر المتوقع من تمويل هذا المشروع."
    )
    return {"draft": draft}


def pair_programming_reply(message: str, history: List[dict]) -> dict:
    """Feature 10: reply to one chat turn in the collaborative-coding window."""
    reply_text = (
        f'(رد تجريبي) فهمت طلبك: "{message}".\n'
        "إليك مقترح كود أولي يمكنك تعديله حسب الحاجة:"
    )
    code = (
        "# Mock generated snippet based on your request\n"
        f"# Request: {message}\n"
        "def solution():\n"
        "    # TODO: replace with a real Claude API response\n"
        "    pass\n"
    )
    return {"reply": reply_text, "code": code}
