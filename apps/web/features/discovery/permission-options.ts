export const permissionOptions = [
  { value: "filesystem_read", en: "Read files", fa: "خواندن فایل‌ها" },
  { value: "filesystem_write", en: "Write files", fa: "نوشتن فایل‌ها" },
  { value: "process_execution", en: "Run processes", fa: "اجرای فرایندها" },
  { value: "network_access", en: "Access the network", fa: "دسترسی به شبکه" },
  { value: "environment_access", en: "Read environment variables", fa: "خواندن متغیرهای محیطی" },
  { value: "secret_access", en: "Access secrets", fa: "دسترسی به اطلاعات محرمانه" },
  { value: "browser_automation", en: "Automate the browser", fa: "خودکارسازی مرورگر" },
  { value: "external_account_access", en: "Access external accounts", fa: "دسترسی به حساب‌های خارجی" },
  { value: "persistent_storage", en: "Store data persistently", fa: "ذخیره‌سازی ماندگار داده‌ها" },
  { value: "background_execution", en: "Run in the background", fa: "اجرا در پس‌زمینه" },
  { value: "code_modification", en: "Modify code", fa: "تغییر کد" },
  { value: "telemetry", en: "Send telemetry", fa: "ارسال داده‌های تله‌متری" },
] as const;
