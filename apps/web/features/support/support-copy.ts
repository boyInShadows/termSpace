import { supportLabel } from "./support-label";
import type { Locale } from "@/lib/i18n";

export const supportCopy = {
  en: {
    removedMessage: "Message removed after account deletion.",
    rateLimited: "Too many support messages. Wait 15 minutes and try again. Your draft is still here.",
    screenshots: "Screenshots (optional)", screenshotHelp: "Up to 3 PNG, JPEG or WebP images. 5 MiB each, 10 MiB total. Remove passwords and personal details first.",
    screenshot: "Screenshot", removeScreenshot: "Remove screenshot", openScreenshot: "Open screenshot",
    imageLimit: "Use at most 3 screenshots, 5 MiB each and 10 MiB total.",
    invalidImage: "Choose a readable, still PNG, JPEG or WebP screenshot under 16 million pixels.",
    invalidUpload: "The screenshot upload could not be read. Choose the files again and retry.",
    imageUnavailable: "This screenshot could not be loaded. Try again.",
    staffWaiting: "Waiting for member", title: supportLabel.en, privacy: "Private conversations with TermSpace administrators. Only you and administrators can read your tickets.",
    newTicket: "New ticket", tickets: "Your tickets", empty: "No tickets yet. Tell us what you need help with.",
    category: "Category", subject: "Subject", message: "Message", send: "Send ticket", sending: "Sending…", back: "Back to tickets",
    inbox: "Support inbox", emptyInbox: "No tickets in this view.", member: "Member", all: "All tickets", reply: "Send reply", resolve: "Mark resolved", resolving: "Resolving…",
    resolved: "This ticket is resolved. Reply if you still need help; your reply will reopen it.",
    staffResolved: "This ticket is resolved. A new member reply will reopen it.",
    conflict: "This ticket changed. Your draft is still here. Review the latest messages, then try again.",
    replyHelp: "1–10,000 characters. Only this member and administrators can read the conversation.",
    unavailable: "This ticket is no longer available to your account.",
    help: "Describe what happened, what you expected, and any steps that help us reproduce the problem. Do not include passwords or access tokens.",
    subjectHelp: "5–160 characters", messageHelp: "20–10,000 characters", next: "Older", previous: "Newer", you: "You", staff: "TermSpace support",
    notFound: "Ticket not found", retry: "Try again", error: "Support could not be loaded. Try again.",
    network: "Could not reach support. Check your connection and try again. Your draft is still here.",
    validation: "Check the category, subject (5–160 characters) and message (20–10,000 characters).",
    expired: "Your session has ended. Sign in again to send this ticket.", signIn: "Sign in", loading: "Loading support…",
    categories: { TECHNICAL: "Technical problem", LISTING: "Listing/submission help", GENERAL: "General question" },
    statuses: { WAITING_FOR_SUPPORT: "Waiting for support", WAITING_FOR_MEMBER: "Waiting for you", RESOLVED: "Resolved" },
  },
  fa: {
    removedMessage: "این پیام پس از حذف حساب پاک شده است.",
    rateLimited: "تعداد پیام‌های پشتیبانی زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید. پیش‌نویس شما حفظ شده است.",
    screenshots: "تصویرهای صفحه (اختیاری)", screenshotHelp: "حداکثر ۳ تصویر PNG، JPEG یا WebP؛ هر تصویر ۵ و مجموع ۱۰ مگابایت. ابتدا رمزها و اطلاعات شخصی را حذف کنید.",
    screenshot: "تصویر صفحه", removeScreenshot: "حذف تصویر", openScreenshot: "باز کردن تصویر",
    imageLimit: "حداکثر ۳ تصویر، هرکدام ۵ و در مجموع ۱۰ مگابایت انتخاب کنید.",
    invalidImage: "یک تصویر ثابت و سالم PNG، JPEG یا WebP با کمتر از ۱۶ میلیون پیکسل انتخاب کنید.",
    invalidUpload: "تصویرها دریافت نشدند. فایل‌ها را دوباره انتخاب و ارسال کنید.",
    imageUnavailable: "تصویر بارگیری نشد. دوباره تلاش کنید.",
    staffWaiting: "در انتظار پاسخ کاربر",
    title: "پشتیبانی", privacy: "گفت‌وگوی خصوصی با مدیران ترم‌اسپیس. فقط شما و مدیران می‌توانید تیکت‌های شما را بخوانید.",
    newTicket: "تیکت جدید", tickets: "تیکت‌های شما", empty: "هنوز تیکتی ندارید. بگویید در چه موردی به کمک نیاز دارید.",
    category: "دسته‌بندی", subject: "موضوع", message: "پیام", send: "ارسال تیکت", sending: "در حال ارسال…", back: "بازگشت به تیکت‌ها",
    inbox: "صندوق پشتیبانی", emptyInbox: "تیکتی در این بخش نیست.", member: "کاربر", all: "همهٔ تیکت‌ها", reply: "ارسال پاسخ", resolve: "علامت‌گذاری به‌عنوان حل‌شده", resolving: "در حال ثبت…",
    resolved: "این تیکت حل شده است. اگر هنوز به کمک نیاز دارید، پاسخ دهید تا دوباره باز شود.",
    staffResolved: "این تیکت حل شده است. پاسخ جدید کاربر آن را دوباره باز می‌کند.",
    conflict: "تیکت تغییر کرده است. پیش‌نویس شما حفظ شده؛ آخرین پیام‌ها را بررسی کنید و دوباره تلاش کنید.",
    replyHelp: "۱ تا ۱۰٬۰۰۰ نویسه. فقط این کاربر و مدیران می‌توانند گفت‌وگو را بخوانند.",
    unavailable: "این تیکت دیگر برای حساب شما در دسترس نیست.",
    help: "توضیح دهید چه اتفاقی افتاد، چه انتظاری داشتید و چگونه می‌توان مشکل را دوباره دید. رمز عبور یا توکن دسترسی نفرستید.",
    subjectHelp: "۵ تا ۱۶۰ نویسه", messageHelp: "۲۰ تا ۱۰٬۰۰۰ نویسه", next: "قدیمی‌تر", previous: "جدیدتر", you: "شما", staff: "پشتیبانی ترم‌اسپیس",
    notFound: "تیکت پیدا نشد", retry: "تلاش دوباره", error: "پشتیبانی بارگیری نشد. دوباره تلاش کنید.",
    network: "ارتباط با پشتیبانی برقرار نشد. اتصال را بررسی کنید و دوباره تلاش کنید. پیش‌نویس شما حفظ شده است.",
    validation: "دسته‌بندی، موضوع (۵ تا ۱۶۰ نویسه) و پیام (۲۰ تا ۱۰٬۰۰۰ نویسه) را بررسی کنید.",
    expired: "نشست شما پایان یافته است. برای ارسال تیکت دوباره وارد شوید.", signIn: "ورود", loading: "در حال بارگیری پشتیبانی…",
    categories: { TECHNICAL: "مشکل فنی", LISTING: "راهنمایی ثبت و ارسال ابزار", GENERAL: "پرسش عمومی" },
    statuses: { WAITING_FOR_SUPPORT: "در انتظار پشتیبانی", WAITING_FOR_MEMBER: "در انتظار پاسخ شما", RESOLVED: "حل‌شده" },
  },
} as const;

export function supportFailureCopy(code: string, locale: Locale) {
  const c = supportCopy[locale];
  if (code === "FILE_TOO_LARGE" || code === "SCREENSHOTS_TOO_LARGE") return c.imageLimit;
  if (code === "INVALID_IMAGE") return c.invalidImage;
  if (code === "INVALID_UPLOAD" || code === "UPLOAD_ERROR") return c.invalidUpload;
  if (code === "RATE_LIMITED") return c.rateLimited;
  return null;
}
