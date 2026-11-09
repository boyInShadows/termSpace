import type { Locale } from "@/lib/i18n";

/**
 * Draft policy text, written from what the code does today. It has not had legal
 * review and names no governing law; have it checked before relying on it.
 * Legal entity and contact address come from LEGAL_ENTITY_NAME / LEGAL_CONTACT_EMAIL
 * (runtime env, required by docker-compose.yml) so no placeholder ships.
 */
export const LEGAL_UPDATED = "2026-11-09";

export const legalEntity = () => process.env.LEGAL_ENTITY_NAME?.trim() || "TermSpace";
export const legalContact = () => process.env.LEGAL_CONTACT_EMAIL?.trim() || undefined;

export type LegalSlug = "privacy" | "terms" | "content-policy";
type LegalDoc = { title: string; intro: string; sections: { heading: string; body?: string[]; list?: string[] }[] };

export const legalLabels = {
  en: { updated: "Last updated", contact: "Contact", privacy: "Privacy policy", terms: "Terms of use", "content-policy": "Content and review policy", legal: "Legal" },
  fa: { updated: "آخرین به‌روزرسانی", contact: "تماس", privacy: "سیاست حریم خصوصی", terms: "شرایط استفاده", "content-policy": "سیاست محتوا و بررسی", legal: "حقوقی" },
} as const;

export const legalDocs: Record<Locale, Record<LegalSlug, LegalDoc>> = {
  en: {
    privacy: {
      title: "Privacy policy",
      intro: "This policy covers the TermSpace marketplace and the TermSpace journal, which share one reader account.",
      sections: [
        { heading: "What we hold", list: [
          "Account data: your email address, a salted hash of your password (never the password itself), and whether your email is verified. If you sign in with Google, we receive your email address and the basic profile details Google provides.",
          "Private profile details: the role, goal, coding tools and starting preference you provide during onboarding or in Dashboard → Profile. You can edit these answers in Profile; they are included in your account export and erased when you delete your account.",
          "What you do while signed in: favourites, your library and installs, reviews and ratings, bookmarks and reading progress, and your creator profile and submissions if you publish.",
          "What you send us: newsletter sign-ups, comments, and any message you write to us.",
          "Server logs: request time, path, status, duration and IP address. Cookies and authorization headers are redacted, and request bodies are not logged.",
        ] },
        { heading: "Cookies and local storage", body: [
          "We set first-party session cookies to keep you signed in. They are not readable by scripts on the page. Your browser also stores preferences such as theme, language and dismissed notices.",
          "We do not run analytics or advertising trackers. If you choose Google sign-in, your browser loads Google's sign-in script and Google handles that sign-in under its own policy.",
        ] },
        { heading: "Who else handles data", list: [
          "An email delivery provider (Cloudflare) sends verification and password-reset messages.",
          "Our hosting and database providers process data on our behalf.",
          "Source checks for submitted listings read public information from GitHub and npm.",
        ] },
        { heading: "What is public", body: ["Reviews, creator profiles and published listings are visible to everyone. Your email address and library are not."] },
        { heading: "Listing views", body: ["Each published listing keeps a daily count of views so its creator can see whether the page is being found. A view is counted once when the page opens; we store only the listing, the date and the total, never an IP address, cookie, session or other identifier for it. Browsers that send Do Not Track or Global Privacy Control are not counted."] },
        { heading: "Your choices", body: ["Sign in and open Settings to download your data or delete your account. Deleting is permanent: it removes your sign-in, favourites, bookmarks, reading progress, reviews and stored credentials, and anonymizes your creator profile. We keep a record that an acquisition, report or moderation action happened, linked only to an anonymized account that cannot sign in. Creators must first withdraw or archive submitted and published listings. You can change your newsletter subscription in Settings. To correct other data or remove a journal comment, write to us. We keep logs and account data only as long as we need them to run and secure the service."] },
        { heading: "Private support", body: [
          "Private tickets contain your category, subject, messages and optional screenshots. Only you, current marketplace administrators and moderators can access your tickets. Screenshots are re-encoded without their original metadata and stored outside public media. Ticket alerts show an event, not message or screenshot content.",
          "Your export includes ticket messages, screenshot references and visible support alerts. Download screenshots separately while you still have ticket access. Account deletion removes your tickets, screenshots and alerts, and erases your past staff replies without deleting other members' tickets. Deleted screenshots become unavailable immediately; background cleanup retries failed file removal.",
        ] },
        { heading: "Changes", body: ["We will update the date above when this policy changes."] },
      ],
    },
    terms: {
      title: "Terms of use",
      intro: "By creating an account or using TermSpace you agree to these terms.",
      sections: [
        { heading: "Your account", body: ["Keep your sign-in details private and give us a working email address. You are responsible for activity under your account."] },
        { heading: "Acceptable use", list: [
          "Do not attack, probe or overload the service, or work around rate limits or moderation.",
          "Do not post malware, hidden data collection, or anything that deceives people about what a listing does.",
          "Do not post content you have no right to share, or that harasses others.",
        ] },
        { heading: "What you publish", body: [
          "You keep ownership of what you submit. You give us permission to host, display and distribute it as part of operating TermSpace, including listing pages, search and library features. Your listing's own licence governs how others may use the tool.",
          "Submissions are reviewed under the content and review policy. We may hide, suspend or archive a listing, review or account that breaks these terms or that we cannot verify.",
        ] },
        { heading: "Third-party tools", body: ["Listings are made by their creators. A listing appearing here, or in a community, is not an endorsement by us or by the platform it targets. Check a listing's declared permissions before you install it."] },
        { heading: "No warranty", body: ["TermSpace is provided as is. We do not guarantee that it is uninterrupted or error-free, or that any listing is safe or fit for your purpose."] },
        { heading: "Changes", body: ["We may update these terms. Using TermSpace after the date above means you accept the current version."] },
      ],
    },
    "content-policy": {
      title: "Content and review policy",
      intro: "How listings are reviewed, what we do not allow, and how to report a problem.",
      sections: [
        { heading: "How a listing is reviewed", list: [
          "A creator submits a listing with a manifest that declares its source, ownership and the capabilities it uses, such as secret access, running processes, writing files or network access.",
          "A listing can point to a public repository or package the submitter proves they control, or to a plain link. Link listings are marked as not verified, are not pinned to one version, and can change after review. Anyone sharing someone else's project must credit the real author. We do not run submitted code on our servers.",
          "A moderator reviews the listing and the declared capabilities before it appears publicly. The listing page shows those permissions.",
          "Reviewed means a person looked at what the listing declares. It is not a guarantee that the code is safe.",
        ] },
        { heading: "Not allowed", list: [
          "Malware, credential theft, or code that sends data somewhere the listing does not declare.",
          "Listings that misstate what they do, who made them, or which platform endorses them.",
          "Material that infringes someone else's rights.",
          "Reviews that are abusive, spam, or not based on real use.",
        ] },
        { heading: "Moderation", body: ["Moderators can approve, reject, suspend or archive listings and hide reviews, and record a reason. Creators can edit and resubmit."] },
        { heading: "Report a problem or request a takedown", body: ["Email us with the URL of the listing or review, what is wrong, and, for a rights claim, what you own and how you are the rights holder. We may hide the item while we look into it."] },
      ],
    },
  },
  fa: {
    privacy: {
      title: "سیاست حریم خصوصی",
      intro: "این سیاست دربرگیرندهٔ بازارچهٔ ترم‌اسپیس و مجلهٔ ترم‌اسپیس است که یک حساب کاربری مشترک دارند.",
      sections: [
        { heading: "داده‌هایی که نگهداری می‌کنیم", list: [
          "داده‌های حساب: نشانی ایمیل، چکیدهٔ نمک‌دار گذرواژه (نه خود گذرواژه) و وضعیت تأیید ایمیل. اگر با گوگل وارد شوید، نشانی ایمیل و اطلاعات پایهٔ نمایه‌ای را که گوگل ارائه می‌کند دریافت می‌کنیم.",
          "اطلاعات خصوصی پروفایل: نقش، هدف، ابزارهای کدنویسی و نقطهٔ شروعی که هنگام راه‌اندازی حساب یا در پیشخوان ← پروفایل وارد می‌کنید. می‌توانید پاسخ‌ها را در پروفایل ویرایش کنید؛ این پاسخ‌ها در خروجی داده‌های حساب قرار می‌گیرند و با حذف حساب پاک می‌شوند.",
          "فعالیت شما پس از ورود: علاقه‌مندی‌ها، کتابخانه و نصب‌ها، نقدها و امتیازها، نشانک‌ها و پیشرفت مطالعه و در صورت انتشار، نمایهٔ سازنده و ارسال‌های شما.",
          "آنچه برای ما می‌فرستید: عضویت در خبرنامه، دیدگاه‌ها و هر پیامی که به ما می‌نویسید.",
          "گزارش‌های کارگزار: زمان درخواست، مسیر، وضعیت، مدت پاسخ و نشانی IP. کوکی‌ها و سرایندهای احراز هویت پنهان می‌شوند و متن درخواست‌ها ثبت نمی‌شود.",
        ] },
        { heading: "کوکی‌ها و ذخیرهٔ محلی", body: [
          "برای حفظ ورود شما از کوکی‌های نشست درون‌سایتی استفاده می‌کنیم که اسکریپت‌های صفحه به آن‌ها دسترسی ندارند. مرورگر شما همچنین تنظیماتی مانند پوسته، زبان و اعلان‌های بسته‌شده را نگه می‌دارد.",
          "ما ابزار تحلیل رفتار یا ردیاب تبلیغاتی به کار نمی‌بریم. اگر ورود با گوگل را انتخاب کنید، مرورگر شما اسکریپت ورود گوگل را بارگذاری می‌کند و آن ورود تابع سیاست خود گوگل است.",
        ] },
        { heading: "چه کسانی دیگر داده را پردازش می‌کنند", list: [
          "یک ارائه‌دهندهٔ ارسال ایمیل (Cloudflare) پیام‌های تأیید و بازیابی گذرواژه را می‌فرستد.",
          "ارائه‌دهندگان میزبانی و پایگاه داده از طرف ما داده را پردازش می‌کنند.",
          "بررسی منبع فهرست‌های ارسال‌شده، اطلاعات عمومی GitHub و npm را می‌خواند.",
        ] },
        { heading: "آنچه عمومی است", body: ["نقدها، نمایهٔ سازندگان و فهرست‌های منتشرشده برای همه دیدنی است. نشانی ایمیل و کتابخانهٔ شما دیدنی نیست."] },
        { heading: "بازدیدهای فهرست", body: ["برای هر فهرست منتشرشده، شمار بازدید به‌صورت روزانه نگه داشته می‌شود تا سازنده ببیند صفحه دیده می‌شود یا نه. هر بار که صفحه باز شود یک بازدید شمرده می‌شود؛ فقط فهرست، تاریخ و جمع کل ذخیره می‌شود و نشانی IP، کوکی، نشست یا شناسهٔ دیگری برای آن نگه داشته نمی‌شود. مرورگرهایی که Do Not Track یا Global Privacy Control می‌فرستند شمرده نمی‌شوند."] },
        { heading: "حق انتخاب شما", body: ["وارد شوید و تنظیمات را باز کنید تا داده‌هایتان را دریافت یا حساب خود را حذف کنید. حذف دائمی است: ورود، علاقه‌مندی‌ها، نشانک‌ها، پیشرفت مطالعه، نقدها و اطلاعات دسترسی ذخیره‌شده‌تان حذف و نمایهٔ سازنده‌تان ناشناس می‌شود. سابقهٔ اینکه یک دریافت، گزارش یا اقدام نظارتی انجام شده را فقط به یک حساب ناشناس‌شده که امکان ورود ندارد متصل نگه می‌داریم. سازندگان باید ابتدا فهرست‌های ارسال‌شده و منتشرشده را پس بگیرند یا بایگانی کنند. عضویت شما در خبرنامه از بخش تنظیمات قابل تغییر است. برای اصلاح دیگر داده‌ها یا حذف یک دیدگاه مجله به ما نامه بنویسید. گزارش‌ها و داده‌های حساب را فقط تا هر زمان که برای اجرا و ایمن‌سازی سرویس لازم باشد نگه می‌داریم."] },
        { heading: "پشتیبانی خصوصی", body: [
          "تیکت خصوصی شامل دسته‌بندی، موضوع، پیام‌ها و تصویرهای اختیاری شماست. فقط شما و مدیران و ناظران فعلی بازارچه به تیکت شما دسترسی دارند. تصویرها بدون فرادادهٔ اصلی دوباره ذخیره می‌شوند و در رسانهٔ عمومی قرار نمی‌گیرند. اعلان تیکت فقط رویداد را نشان می‌دهد، نه محتوای پیام یا تصویر را.",
          "فایل داده‌ها شامل پیام‌های تیکت، مشخصات تصویرها و اعلان‌های پشتیبانی در دسترس شماست. تصویرها را تا زمانی که به تیکت دسترسی دارید جداگانه دریافت کنید. با حذف حساب، تیکت‌ها، تصویرها و اعلان‌های شما حذف و پاسخ‌های قبلی شما به‌عنوان پشتیبان پاک می‌شوند؛ تیکت دیگر کاربران باقی می‌ماند. دسترسی به تصویر حذف‌شده بلافاصله قطع می‌شود و اگر پاک‌کردن فایل شکست بخورد، پاک‌سازی پس‌زمینه دوباره تلاش می‌کند.",
        ] },
        { heading: "تغییرات", body: ["هرگاه این سیاست تغییر کند، تاریخ بالای صفحه به‌روز می‌شود."] },
      ],
    },
    terms: {
      title: "شرایط استفاده",
      intro: "با ساختن حساب یا استفاده از ترم‌اسپیس، این شرایط را می‌پذیرید.",
      sections: [
        { heading: "حساب شما", body: ["اطلاعات ورود خود را محرمانه نگه دارید و نشانی ایمیل فعال ارائه کنید. مسئولیت فعالیت‌های انجام‌شده با حساب شما بر عهدهٔ خودتان است."] },
        { heading: "استفادهٔ مجاز", list: [
          "به سرویس حمله نکنید، آن را وارسی یا پرفشار نکنید و محدودیت نرخ یا بررسی محتوا را دور نزنید.",
          "بدافزار، گردآوری پنهان داده یا هر چیزی را که دربارهٔ کار یک فهرست گمراه‌کننده باشد منتشر نکنید.",
          "محتوایی را که حق به‌اشتراک‌گذاری آن را ندارید یا دیگران را آزار می‌دهد منتشر نکنید.",
        ] },
        { heading: "آنچه منتشر می‌کنید", body: [
          "مالکیت آنچه ارسال می‌کنید با شماست. شما به ما اجازه می‌دهید آن را برای اداره‌کردن ترم‌اسپیس، از جمله صفحهٔ فهرست، جست‌وجو و کتابخانه، میزبانی، نمایش و توزیع کنیم. مجوز خود فهرست تعیین می‌کند دیگران چگونه از ابزار استفاده کنند.",
          "ارسال‌ها طبق سیاست محتوا و بررسی ارزیابی می‌شوند. ممکن است فهرست، نقد یا حسابی را که این شرایط را نقض کند یا نتوانیم آن را راستی‌آزمایی کنیم پنهان، معلق یا بایگانی کنیم.",
        ] },
        { heading: "ابزارهای شخص ثالث", body: ["فهرست‌ها را سازندگانشان می‌سازند. حضور یک فهرست در اینجا یا در یک جامعه، تأیید از سوی ما یا سکوی مقصد آن نیست. پیش از نصب، مجوزهای اعلام‌شدهٔ فهرست را بررسی کنید."] },
        { heading: "بدون ضمانت", body: ["ترم‌اسپیس «به همین صورت» ارائه می‌شود. ضمانت نمی‌کنیم که بدون وقفه یا بدون خطا باشد، یا که هر فهرست ایمن یا مناسب هدف شما باشد."] },
        { heading: "تغییرات", body: ["ممکن است این شرایط را به‌روز کنیم. استفاده از ترم‌اسپیس پس از تاریخ بالای صفحه به‌معنای پذیرش نسخهٔ جاری است."] },
      ],
    },
    "content-policy": {
      title: "سیاست محتوا و بررسی",
      intro: "فهرست‌ها چگونه بررسی می‌شوند، چه چیزهایی مجاز نیست و مشکلات را چگونه گزارش کنید.",
      sections: [
        { heading: "بررسی یک فهرست", list: [
          "سازنده فهرست را همراه مانیفستی ارسال می‌کند که منبع، مالکیت و قابلیت‌های مورد استفاده، مانند دسترسی به رازها، اجرای فرایندها، نوشتن فایل یا دسترسی به شبکه را اعلام می‌کند.",
          "فهرست می‌تواند به مخزن یا بستهٔ عمومی‌ای اشاره کند که ارسال‌کننده در اختیار داشتنش را ثابت می‌کند، یا به یک پیوند ساده. فهرست‌های پیوندی با برچسب تأییدنشده نمایش داده می‌شوند، به نسخهٔ مشخصی قفل نیستند و ممکن است پس از بررسی تغییر کنند. هر کس پروژهٔ دیگری را معرفی می‌کند باید نام سازندهٔ واقعی را بیاورد. کد ارسال‌شده را روی کارگزارهای خود اجرا نمی‌کنیم.",
          "یک ناظر پیش از نمایش عمومی، فهرست و قابلیت‌های اعلام‌شده را بررسی می‌کند. صفحهٔ فهرست این مجوزها را نشان می‌دهد.",
          "«بررسی‌شده» یعنی فردی آنچه فهرست اعلام کرده را دیده است؛ ضمانت ایمن‌بودن کد نیست.",
        ] },
        { heading: "آنچه مجاز نیست", list: [
          "بدافزار، سرقت اطلاعات ورود یا کدی که داده را به جایی غیر از آنچه فهرست اعلام کرده می‌فرستد.",
          "فهرست‌هایی که دربارهٔ کارکرد، سازنده یا تأیید سکو اطلاعات نادرست می‌دهند.",
          "محتوایی که حقوق دیگران را نقض می‌کند.",
          "نقدهای توهین‌آمیز، هرزنامه یا ناشی از استفادهٔ واقعی نبوده.",
        ] },
        { heading: "نظارت", body: ["ناظران می‌توانند فهرست‌ها را تأیید، رد، معلق یا بایگانی و نقدها را پنهان کنند و دلیل آن را ثبت می‌کنند. سازندگان می‌توانند ویرایش و دوباره ارسال کنند."] },
        { heading: "گزارش مشکل یا درخواست حذف", body: ["نشانی صفحهٔ فهرست یا نقد، مشکل و در ادعای حقوقی، آنچه مالک آن هستید و دلیل صاحب‌حق بودنتان را برای ما ایمیل کنید. ممکن است مورد را تا پایان بررسی پنهان کنیم."] },
      ],
    },
  },
};
