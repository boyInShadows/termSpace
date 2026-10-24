// Library copy stays out of the public catalog locale bundle.
export const libraryCopy = {
  en: {
    label: "Library", quickAction: "Open acquired library", title: "Your library",
    intro: "Free resources you acquired and the exact release pinned to each acquisition.",
    loading: "Loading library…", error: "The library could not be loaded.", retry: "Try again",
    empty: "You have not added any resources yet.", browse: "Browse resources",
    legacy: "Legacy release", install: "View installation", unavailable: "Installation unavailable",
    pages: "Library pages", page: "Page {page} of {pages}", previous: "Previous", next: "Next",
  },
  fa: {
    label: "کتابخانه", quickAction: "باز کردن کتابخانهٔ دریافت‌ها", title: "کتابخانهٔ شما",
    intro: "منابع رایگانی که دریافت کرده‌اید و نسخهٔ دقیق متصل به هر دریافت.",
    loading: "در حال بارگذاری کتابخانه…", error: "بارگذاری کتابخانه انجام نشد.", retry: "تلاش دوباره",
    empty: "هنوز منبعی به کتابخانه اضافه نکرده‌اید.", browse: "مرور منابع",
    legacy: "نسخهٔ قدیمی", install: "مشاهدهٔ نصب", unavailable: "نصب در دسترس نیست",
    pages: "صفحه‌های کتابخانه", page: "صفحهٔ {page} از {pages}", previous: "قبلی", next: "بعدی",
  },
} as const;
