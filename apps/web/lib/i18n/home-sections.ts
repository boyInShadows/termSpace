// Copy for the homepage sections below the hero. Deliberately NOT part of the
// `copy` dictionary in index.ts: that object is imported by client components,
// so everything in it ships to every page. These strings are only used by
// app/page.tsx (a server component), which hands the process steps to the one
// client component that needs them as props, so only the active locale's text
// is sent and only on the homepage.
export const homeSections = {
  en: {
    processEyebrow: "How it works",
    processTitle: "From need to useful, without the leap of faith.",
    processSteps: [
      {
        title: "Search by outcome",
        copy: "Describe the job, not the file format. Results rank on whether the thing actually does what you asked, and compare across platforms and models before you commit.",
      },
      {
        title: "Read what it touches",
        copy: "Contents, permissions, requirements, licence and update history are separate fields on every listing — not paragraphs in a README you have to trust.",
      },
      {
        title: "Put it to work",
        copy: "One command, the exact version you inspected, and updates that arrive with notes from the person who wrote them.",
      },
    ],
    shelves: [
      {
        title: "Tools for careful research",
        copy: "Evidence-first workflows that keep sources, caveats, and reasoning visible.",
      },
      {
        title: "Ship better software",
        copy: "Review, accessibility, and database tools made by practicing engineers.",
      },
      {
        title: "Find the words that work",
        copy: "Brand and conversion systems grounded in customer language, not hype.",
      },
    ],
    trustBadge: "Verified",
    trustBody:
      "Most catalogues bury what a tool actually does inside a paragraph of marketing. We break compatibility, permissions, requirements, licence and safety status into separate fields so you can judge a product before it touches your workflow.",
    trustQuote:
      "A good AI product should tell you what it does, what it touches, and why you can trust it.",
    trustQuoteLink: "The termspace quality standard",
    trustFacts: [
      {
        title: "Human-readable permissions",
        copy: "Every listing states what it reads, writes and calls out to — in a sentence, not a config file.",
      },
      {
        title: "Visible update history",
        copy: "Every version, with notes from the person who shipped it. Pin the one you inspected.",
      },
      {
        title: "Licence on the label",
        copy: "Use, redistribution and attribution are clear before you install anything.",
      },
    ],
    inboxBody:
      "What shipped, what got reviewed, and what is worth your attention. No launch announcements.",
  },
  fa: {
    processEyebrow: "نحوهٔ کار",
    processTitle: "از نیاز تا ابزار کارآمد، بدون اعتماد کورکورانه.",
    processSteps: [
      {
        title: "بر پایهٔ نتیجه جستجو کنید",
        copy: "کار موردنظر را بگویید، نه قالب فایل را. نتایج بر اساس این‌که منبع واقعاً همان کار را انجام می‌دهد رتبه می‌گیرند و پیش از تصمیم می‌توانید پلتفرم‌ها و مدل‌ها را با هم مقایسه کنید.",
      },
      {
        title: "ببینید به چه چیزی دسترسی دارد",
        copy: "محتوا، مجوزها، پیش‌نیازها، پروانهٔ استفاده و تاریخچهٔ به‌روزرسانی در هر فهرست فیلدهای جداگانه‌اند، نه بندهایی در یک README که ناچار باشید به آن‌ها اعتماد کنید.",
      },
      {
        title: "به کار بگیریدش",
        copy: "یک فرمان، همان نسخه‌ای که بررسی کردید، و به‌روزرسانی‌هایی که با یادداشت خودِ سازنده می‌رسند.",
      },
    ],
    shelves: [
      {
        title: "ابزارهایی برای پژوهش دقیق",
        copy: "گردش‌کارهای مبتنی بر شواهد که منابع، قیدها و استدلال را همواره نمایان نگه می‌دارند.",
      },
      {
        title: "نرم‌افزار بهتر بسازید",
        copy: "ابزارهای بازبینی، دسترس‌پذیری و پایگاه داده که مهندسان فعال ساخته‌اند.",
      },
      {
        title: "واژه‌هایی که اثر می‌کنند",
        copy: "نظام‌های برند و تبدیل که بر زبان مشتری بنا شده‌اند، نه بر شعار.",
      },
    ],
    trustBadge: "تأییدشده",
    trustBody:
      "بیشتر فهرست‌ها آنچه یک ابزار واقعاً انجام می‌دهد را لابه‌لای متن تبلیغاتی پنهان می‌کنند. ما سازگاری، مجوزها، پیش‌نیازها، پروانهٔ استفاده و وضعیت ایمنی را در فیلدهای جداگانه می‌آوریم تا پیش از آن‌که محصول به گردش کار شما برسد دربارهٔ آن داوری کنید.",
    trustQuote:
      "یک محصول هوش مصنوعی خوب باید بگوید چه می‌کند، به چه چیزی دست می‌زند و چرا می‌شود به آن اعتماد کرد.",
    trustQuoteLink: "استاندارد کیفیت ترم‌اسپیس",
    trustFacts: [
      {
        title: "مجوزهای خوانا برای انسان",
        copy: "هر فهرست در یک جمله می‌گوید چه چیزی را می‌خواند، می‌نویسد و با چه چیزی ارتباط می‌گیرد، نه در یک فایل پیکربندی.",
      },
      {
        title: "تاریخچهٔ به‌روزرسانی قابل‌مشاهده",
        copy: "هر نسخه همراه با یادداشت کسی که آن را منتشر کرده است. همان نسخه‌ای را که بررسی کردید سنجاق کنید.",
      },
      {
        title: "پروانهٔ استفاده روی برچسب",
        copy: "پیش از نصب هر چیزی، شرایط استفاده، بازنشر و ذکر منبع روشن است.",
      },
    ],
    inboxBody:
      "چه چیزی منتشر شد، چه چیزی بازبینی شد و چه چیزی ارزش توجه شما را دارد. بدون اعلان‌های تبلیغاتی.",
  },
} as const;

export type HomeSections = (typeof homeSections)["en"] | (typeof homeSections)["fa"];
