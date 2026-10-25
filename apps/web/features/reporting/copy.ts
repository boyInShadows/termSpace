import { ApiError } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

export const reportingCopy = {
  en: {
    report: "Report listing", intro: "Tell staff about unsafe, misleading or unavailable content.",
    privacy: "Reports are visible to authorized staff. Do not include passwords, tokens or private files.",
    signIn: "Sign in to send a report", reason: "Reason", explanation: "What happened?", explanationHint: "Describe the issue and where you found it. Use 20–4000 characters.",
    send: "Send report", sending: "Sending…", received: "Report received", receipt: "Receipt", receivedHint: "Keep this receipt if you contact staff. Your report will be reviewed; sending it does not immediately remove the listing.",
    loading: "Loading…", retry: "Retry", loadFailed: "Reporting could not be loaded. Try again.", failed: "The report could not be saved. Your text is still here; try again.",
    unauthorized: "Your session has ended. Sign in again to continue.", denied: "A verified moderator or administrator account is required.",
    unavailable: "This listing or case is unavailable, or your account cannot access it.", limited: "The reporting limit was reached. Wait before trying again.", busy: "The reporting service is busy. Retry shortly.",
    network: "The reporting service could not be reached. Check your connection and retry.", timeout: "The request timed out. Retry with the same details.",
    conflict: "This case changed. Reload it and review the latest decision before submitting again.", closed: "This case is resolved. Its decision cannot be overwritten.", invalid: "Check the field limits and required values, then try again.",
    cases: "Reported listings", casesIntro: "Triage safety and content reports. Reports are evidence; restrictions require a separate authorized decision.",
    listingQueue: "Submission queue", all: "All states", filter: "Case state", apply: "Apply filter", empty: "No cases match this state.", openCase: "Review case", reportCount: "Reports", severity: "Severity", state: "State", created: "Created", updated: "Updated",
    previous: "Previous", next: "Next", page: "Page {page} of {pages}", back: "Back to reported listings", inspect: "Inspect listing", evidence: "Original reports", history: "Audit history", noEvidence: "No reports on this page.", noEvents: "No events on this page.",
    triage: "Case decision", action: "Action", publicReason: "Public-safe explanation", publicReasonHint: "10–1000 characters. Do not identify reporters or include private evidence.", reasonCode: "Reason code", reasonCodeHint: "2–80 uppercase letters, numbers or underscores.", evidenceReference: "Private evidence reference (optional)", evidenceHint: "2–200 characters. Use a restricted storage reference, not credentials or private file contents.",
    save: "Save decision", saving: "Saving…", saved: "Decision saved to the audit history.", reload: "Reload case", caseReference: "Case reference", private: "Staff-only evidence", transition: "Result", reference: "Reference", eventReason: "Decision reason",
    reasons: { MALICIOUS: "Malicious content", UNDISCLOSED_PERMISSIONS: "Undisclosed permissions", SOURCE_COMPROMISE: "Compromised source", IMPERSONATION: "Impersonation or ownership dispute", MISLEADING: "Misleading or incompatible instructions", BROKEN_OR_ABANDONED: "Broken, unavailable or abandoned", SPAM_OR_ABUSE: "Spam, harassment or manipulation", OTHER: "Other issue" },
    states: { NEW: "New", TRIAGED: "Triaged", INVESTIGATING: "Investigating", ACTIONED: "Actioned", DISMISSED: "Dismissed" },
    severities: { STANDARD: "Standard", HIGH: "High", CRITICAL: "Critical" },
    sections: "Case sections", correlation: "Correlation ID",
    actions: { TRIAGE: "Triage", INVESTIGATE: "Investigate", DISMISS: "Dismiss" },
    events: { REPORT_RECEIVED: "Report received", TRIAGE: "Triaged", INVESTIGATE: "Investigation started", DISMISS: "Dismissed" },
    actors: { READER: "Reader", MODERATOR: "Moderator", ADMINISTRATOR: "Administrator" },
  },
  fa: {
    report: "گزارش آگهی", intro: "محتوای ناامن، گمراه‌کننده یا از دسترس خارج‌شده را به ناظران اطلاع دهید.",
    privacy: "گزارش‌ها فقط برای کارکنان مجاز قابل مشاهده‌اند. گذرواژه، توکن یا فایل خصوصی ارسال نکنید.",
    signIn: "برای ارسال گزارش وارد شوید", reason: "دلیل", explanation: "چه اتفاقی افتاده است؟", explanationHint: "مشکل و محل مشاهدهٔ آن را در ۲۰ تا ۴۰۰۰ نویسه توضیح دهید.",
    send: "ارسال گزارش", sending: "در حال ارسال…", received: "گزارش دریافت شد", receipt: "رسید", receivedHint: "برای پیگیری نزد کارکنان، این رسید را نگه دارید. گزارش شما بررسی می‌شود؛ ارسال آن باعث حذف فوری آگهی نمی‌شود.",
    loading: "در حال بارگذاری…", retry: "تلاش دوباره", loadFailed: "بارگذاری گزارش‌ها ممکن نشد. دوباره تلاش کنید.", failed: "گزارش ذخیره نشد. متن شما حفظ شده است؛ دوباره تلاش کنید.",
    unauthorized: "نشست شما پایان یافته است. برای ادامه دوباره وارد شوید.", denied: "حساب ناظر یا مدیر با ایمیل تأییدشده لازم است.",
    unavailable: "این آگهی یا پرونده در دسترس نیست یا حساب شما به آن دسترسی ندارد.", limited: "به محدودیت ارسال گزارش رسیده‌اید. کمی صبر کنید و دوباره تلاش کنید.", busy: "سرویس گزارش‌ها مشغول است. کمی بعد دوباره تلاش کنید.",
    network: "ارتباط با سرویس گزارش‌ها برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.", timeout: "مهلت درخواست پایان یافت. با همین اطلاعات دوباره تلاش کنید.",
    conflict: "این پرونده تغییر کرده است. آن را دوباره بارگذاری و پیش از ارسال، آخرین تصمیم را بررسی کنید.", closed: "این پرونده مختومه است و تصمیم آن قابل بازنویسی نیست.", invalid: "محدودیت فیلدها و مقدارهای الزامی را بررسی و دوباره تلاش کنید.",
    cases: "آگهی‌های گزارش‌شده", casesIntro: "گزارش‌های ایمنی و محتوا را بررسی اولیه کنید. گزارش مدرک است؛ اعمال محدودیت به تصمیم مجاز جداگانه نیاز دارد.",
    listingQueue: "صف آگهی‌های ارسالی", all: "همهٔ وضعیت‌ها", filter: "وضعیت پرونده", apply: "اعمال فیلتر", empty: "پرونده‌ای با این وضعیت وجود ندارد.", openCase: "بررسی پرونده", reportCount: "گزارش‌ها", severity: "شدت", state: "وضعیت", created: "زمان ایجاد", updated: "آخرین تغییر",
    previous: "قبلی", next: "بعدی", page: "صفحهٔ {page} از {pages}", back: "بازگشت به آگهی‌های گزارش‌شده", inspect: "بررسی آگهی", evidence: "گزارش‌های اصلی", history: "تاریخچهٔ ممیزی", noEvidence: "گزارشی در این صفحه نیست.", noEvents: "رویدادی در این صفحه نیست.",
    triage: "تصمیم پرونده", action: "اقدام", publicReason: "توضیح قابل انتشار", publicReasonHint: "۱۰ تا ۱۰۰۰ نویسه؛ هویت گزارش‌دهنده یا مدارک خصوصی را درج نکنید.", reasonCode: "کد دلیل", reasonCodeHint: "۲ تا ۸۰ حرف بزرگ لاتین، عدد یا زیرخط.", evidenceReference: "مرجع مدرک خصوصی (اختیاری)", evidenceHint: "۲ تا ۲۰۰ نویسه؛ مرجع فضای نگهداری محدود را وارد کنید، نه اطلاعات ورود یا محتوای فایل خصوصی.",
    save: "ذخیرهٔ تصمیم", saving: "در حال ذخیره…", saved: "تصمیم در تاریخچهٔ ممیزی ذخیره شد.", reload: "بارگذاری دوبارهٔ پرونده", caseReference: "شناسهٔ پرونده", private: "مدارک ویژهٔ کارکنان", transition: "نتیجه", reference: "مرجع", eventReason: "دلیل تصمیم",
    reasons: { MALICIOUS: "محتوای مخرب", UNDISCLOSED_PERMISSIONS: "دسترسی‌های اعلام‌نشده", SOURCE_COMPROMISE: "منبع دست‌کاری‌شده", IMPERSONATION: "جعل هویت یا اختلاف مالکیت", MISLEADING: "دستورالعمل گمراه‌کننده یا ناسازگار", BROKEN_OR_ABANDONED: "خراب، در دسترس‌نبودن یا رهاشده", SPAM_OR_ABUSE: "هرزنامه، آزار یا دست‌کاری", OTHER: "مشکل دیگر" },
    states: { NEW: "جدید", TRIAGED: "بررسی اولیه‌شده", INVESTIGATING: "در حال تحقیق", ACTIONED: "اقدام‌شده", DISMISSED: "مختومه" },
    severities: { STANDARD: "عادی", HIGH: "زیاد", CRITICAL: "بحرانی" },
    sections: "بخش‌های پرونده", correlation: "شناسهٔ پیگیری",
    actions: { TRIAGE: "بررسی اولیه", INVESTIGATE: "شروع تحقیق", DISMISS: "مختومه‌کردن" },
    events: { REPORT_RECEIVED: "دریافت گزارش", TRIAGE: "بررسی اولیه", INVESTIGATE: "شروع تحقیق", DISMISS: "مختومه‌کردن" },
    actors: { READER: "خواننده", MODERATOR: "ناظر", ADMINISTRATOR: "مدیر" },
  },
};

export function reportingError(cause: unknown, locale: Locale, operation: "read" | "write" = "write") {
  const t = reportingCopy[locale];
  const fallback = operation === "read" ? t.loadFailed : t.failed;
  if (!(cause instanceof ApiError)) return fallback;
  if (cause.code === "CASE_VERSION_CONFLICT") return t.conflict;
  if (cause.code === "CASE_CLOSED") return t.closed;
  if (cause.status === 401) return t.unauthorized;
  if (cause.status === 403) return t.denied;
  if (cause.status === 404) return t.unavailable;
  if (cause.status === 429) return t.limited;
  if (cause.code === "NETWORK_ERROR") return t.network;
  if (cause.code === "CLIENT_TIMEOUT") return t.timeout;
  if (cause.status === 503) return t.busy;
  if (cause.status === 400) return t.invalid;
  return fallback;
}
