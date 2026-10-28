// Library copy stays out of the public catalog locale bundle.
export const LIBRARY_ITEM_TYPES = ["skill", "agent", "mcp_server", "integration", "rule", "prompt", "hook", "template", "workflow"] as const;
export const LIBRARY_SORTS = ["newest", "oldest", "name"] as const;

export const libraryCopy = {
  en: {
    label: "Library", quickAction: "Open acquired library", title: "Your library",
    intro: "Free resources you acquired and the exact release pinned to each acquisition.",
    loading: "Loading library…", error: "The library could not be loaded.", retry: "Try again",
    empty: "You have not added any resources yet.", browse: "Browse resources",
    legacy: "Legacy release", install: "View installation", unavailable: "Installation unavailable",
    pages: "Library pages", page: "Page {page} of {pages}", previous: "Previous", next: "Next",
    filters: "Filter and sort the library", searchLabel: "Search your library", searchButton: "Search",
    typeLabel: "Type", allTypes: "All types", sortLabel: "Sort by",
    sorts: { newest: "Newest first", oldest: "Oldest first", name: "Name (A–Z)" },
    types: { skill: "Skill", agent: "Agent", mcp_server: "MCP server", integration: "Integration", rule: "Rule", prompt: "Prompt", hook: "Hook", template: "Template", workflow: "Workflow" },
    noMatches: "No resources match these filters.", clearFilters: "Clear filters", review: "Rate or review",
  },
  fa: {
    label: "کتابخانه", quickAction: "باز کردن کتابخانهٔ دریافت‌ها", title: "کتابخانهٔ شما",
    intro: "منابع رایگانی که دریافت کرده‌اید و نسخهٔ دقیق متصل به هر دریافت.",
    loading: "در حال بارگذاری کتابخانه…", error: "بارگذاری کتابخانه انجام نشد.", retry: "تلاش دوباره",
    empty: "هنوز منبعی به کتابخانه اضافه نکرده‌اید.", browse: "مرور منابع",
    legacy: "نسخهٔ قدیمی", install: "مشاهدهٔ نصب", unavailable: "نصب در دسترس نیست",
    pages: "صفحه‌های کتابخانه", page: "صفحهٔ {page} از {pages}", previous: "قبلی", next: "بعدی",
    filters: "فیلتر و مرتب‌سازی کتابخانه", searchLabel: "جستجو در کتابخانه", searchButton: "جستجو",
    typeLabel: "نوع", allTypes: "همهٔ انواع", sortLabel: "مرتب‌سازی",
    sorts: { newest: "جدیدترین", oldest: "قدیمی‌ترین", name: "نام (الفبایی)" },
    types: { skill: "مهارت", agent: "عامل", mcp_server: "سرور MCP", integration: "یکپارچه‌سازی", rule: "قاعده", prompt: "پرامپت", hook: "هوک", template: "قالب", workflow: "گردش‌کار" },
    noMatches: "منبعی با این فیلترها پیدا نشد.", clearFilters: "پاک کردن فیلترها", review: "امتیاز و نقد",
  },
} as const;
