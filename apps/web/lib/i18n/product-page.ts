/** The product page's own strings, outside the client dictionary so they cost the page no JavaScript. */
export function productPageLabels(fa: boolean) {
  return fa
    ? {
        explore: "کاوش", details: "جزئیات", requirements: "پیش‌نیازها", updated: "به‌روزرسانی", package: "بسته", updatesPolicy: "سیاست به‌روزرسانی", verified: "تأییدشده", notReviewed: "هنوز بررسی نشده", safety: "بررسی‌شده", pending: "در انتظار بررسی",
        notDeclared: "اعلام نشده", scope: "دامنهٔ دسترسی", notStated: "ذکر نشده", licence: "مجوز", uses: "استفاده",
        free: "رایگان برای همه", sharing: "اشتراک‌گذاری جامعه", whatItDoes: "چه می‌کند", manifest: "مانیفست",
        useCases: "کاربردهای مناسب", included: "محتویات", example: "نمونهٔ ورودی و خروجی", input: "ورودی", output: "بخشی از خروجی",
        reviews: "نقدها", noReviews: "هنوز نقدی ثبت نشده است.", verifiedUse: "استفادهٔ تأییدشده", worksWith: "سازگار با", models: "مدل‌ها",
        creator: "دربارهٔ سازنده", resources: "منبع", resource: "منبع", followers: "دنبال‌کننده", related: "منابع مرتبط", keepBuilding: "ادامه دهید",
        passed: "بررسی بسته انجام شد", notYet: "هنوز توسط تیم بررسی نشده", files: "فایل",
        installNote: "مراحل دقیق نصب به نسخه‌ای که به کتابخانهٔ خود اضافه می‌کنید متصل است.",
      }
    : {
        explore: "Explore", details: "Details", requirements: "Requirements", updated: "Updated", package: "Package", updatesPolicy: "Updates", verified: "Verified", notReviewed: "Not yet reviewed", safety: "reviewed", pending: "review pending",
        notDeclared: "Not declared", scope: "permission scope", notStated: "Not stated", licence: "licence", uses: "uses",
        free: "Free for everyone", sharing: "Community sharing", whatItDoes: "What it does", manifest: "Manifest",
        useCases: "Ideal use cases", included: "What’s included", example: "Example input and output", input: "Input", output: "Output excerpt",
        reviews: "Reviews", noReviews: "No reviews yet.", verifiedUse: "Verified use", worksWith: "Works with", models: "Models",
        creator: "About the creator", resources: "resources", resource: "resource", followers: "followers", related: "Related listings", keepBuilding: "Keep building",
        passed: "Package scan passed", notYet: "Not yet reviewed by the team", files: "files",
        installNote: "Exact installation steps are tied to the release you add to your library.",
      };
}

export type ProductPageLabels = ReturnType<typeof productPageLabels>;
