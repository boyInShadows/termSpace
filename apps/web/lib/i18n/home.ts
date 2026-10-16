// The homepage. Split from lib/i18n.ts (plan P7).
export const home = {
  en: {
    homePage: {
      dismissAnnouncement: "Dismiss announcement",
      toDarkTheme: "Switch to dark theme",
      toLightTheme: "Switch to light theme",
      newsletterEmail: "Email address",
      newsletterCta: "Subscribe",
      newsletterSending: "Subscribing…",
      newsletterDone: "You are on the list.",
      newsletterDoneBody: "The next issue arrives on Friday.",
      newsletterInvalid: "That does not look like an email address.",
      newsletterBusy: "Too many attempts. Please wait a moment and try again.",
      newsletterError: "Subscription failed. Please try again.",
      newsletterPrivacy: "One email a week. Unsubscribe any time.",
      searchLabel: "Search community resources by outcome",
      searchPrompt: "What do you want AI to do better?",
      searchCta: "Search",
      typedIntents: [
        "review my pull request like a staff engineer",
        "turn customer interviews into landing page copy",
        "keep sources and caveats visible while researching",
        "audit a schema before it hits production",
        "write release notes people actually read",
      ],
      searchShortcuts: { skill: "Skills", agent: "Agents", mcp_server: "MCP servers", prompt: "Prompts", rule: "Rules" },
      heroChips: {
        verified: { label: "Verified", sub: "safety reviewed" },
        network: { label: "No network", sub: "permission scope" },
        versions: "12 versions",
      },
      creatorStats: "{products} products · {followers} followers",
      manifestTitle: "termspace · inspect",
      manifestPause: "Pause demo",
      manifestReplay: "Replay",
      recentSearches: "Recent searches",
      popularSearches: "Popular searches",
      browseEyebrow: "Where to start",
      browseTitle: "Browse the library.",
      browseIntro:
        "Shelves assembled by people who use this stuff daily, or the whole catalogue by practice.",
      tabCollections: "Collections",
      tabPractice: "By practice",
      listingCount: "{count} listings",
      creatorCtaTitle: "A serious shelf for your best work.",
      creatorCtaBody:
        "Publish with rich previews, version history and compatibility metadata.",
      creatorCtaPrimary: "Start publishing",
      creatorCtaSecondary: "Creator guide",
      worksWithModels: "Models",
      worksWithEditors: "Editors & CLIs",
      worksWithProtocols: "Protocols",
      degradedTitle: "Showing an example catalogue.",
      degradedBody:
        "The community library could not be reached, so these listings are placeholders.",
      retry: "Retry",
      retrying: "Retrying…",
      loadingFeatured: "Loading featured building blocks",
      loadingCreators: "Loading featured creators",
      loadingPractice: "Loading practice areas",
      emptyFeaturedTitle: "Nothing featured yet",
      emptyFeaturedBody:
        "Featured listings are chosen after review. The full catalogue is open in the meantime.",
      emptyFeaturedCta: "Browse everything",
      emptyCreatorsTitle: "No creator profiles yet",
      emptyCreatorsBody:
        "The first published creators will appear here. Yours could be one of them.",
      emptyCreatorsCta: "Share your work",
      emptyPracticeTitle: "No practice areas yet",
      emptyPracticeBody:
        "Categories appear once listings are published into them.",
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
  },
  fa: {
    homePage: {
      dismissAnnouncement: "بستن اطلاعیه",
      toDarkTheme: "تغییر به پوستهٔ تیره",
      toLightTheme: "تغییر به پوستهٔ روشن",
      newsletterEmail: "نشانی ایمیل",
      newsletterCta: "عضویت",
      newsletterSending: "در حال ثبت…",
      newsletterDone: "ثبت شد.",
      newsletterDoneBody: "شمارهٔ بعدی جمعه می‌رسد.",
      newsletterInvalid: "این نشانی ایمیل معتبر نیست.",
      newsletterBusy: "درخواست‌ها بیش از حد است. کمی صبر کنید و دوباره تلاش کنید.",
      newsletterError: "ثبت عضویت انجام نشد. دوباره تلاش کنید.",
      newsletterPrivacy: "هفته‌ای یک ایمیل. هر زمان بخواهید لغو کنید.",
      searchLabel: "جستجوی منابع بر پایهٔ نتیجه",
      searchPrompt: "دوست دارید هوش مصنوعی چه کاری را بهتر انجام دهد؟",
      searchCta: "جستجو",
      typedIntents: [
        "پول‌ریکوئستم را مثل یک مهندس ارشد بررسی کن",
        "مصاحبه‌های مشتری را به متن صفحهٔ فرود تبدیل کن",
        "هنگام پژوهش، منابع و قیدها را نمایان نگه دار",
        "پیش از انتشار، طرح پایگاه داده را بازبینی کن",
        "یادداشت انتشاری بنویس که واقعاً خوانده شود",
      ],
      searchShortcuts: { skill: "مهارت‌ها", agent: "عامل‌ها", mcp_server: "سرورهای MCP", prompt: "پرامپت‌ها", rule: "قواعد" },
      heroChips: {
        verified: { label: "تأییدشده", sub: "بررسی ایمنی" },
        network: { label: "بدون شبکه", sub: "دامنهٔ دسترسی" },
        versions: "۱۲ نسخه",
      },
      creatorStats: "{products} منبع · {followers} دنبال‌کننده",
      manifestTitle: "ترم‌اسپیس · بررسی",
      manifestPause: "توقف نمایش",
      manifestReplay: "پخش دوباره",
      recentSearches: "جستجوهای اخیر",
      popularSearches: "جستجوهای پرطرفدار",
      browseEyebrow: "از کجا شروع کنیم",
      browseTitle: "کتابخانه را مرور کنید.",
      browseIntro:
        "قفسه‌هایی که اهل کار چیده‌اند، یا همهٔ فهرست بر پایهٔ حوزهٔ کاری.",
      tabCollections: "مجموعه‌ها",
      tabPractice: "بر پایهٔ حوزه",
      listingCount: "{count} منبع",
      creatorCtaTitle: "قفسه‌ای درخور بهترین کارتان.",
      creatorCtaBody:
        "با پیش‌نمایش کامل، تاریخچهٔ نسخه‌ها و اطلاعات سازگاری منتشر کنید.",
      creatorCtaPrimary: "شروع انتشار",
      creatorCtaSecondary: "راهنمای سازندگان",
      worksWithModels: "مدل‌ها",
      worksWithEditors: "ویرایشگرها و خط فرمان",
      worksWithProtocols: "پروتکل‌ها",
      degradedTitle: "فهرست نمونه نمایش داده می‌شود.",
      degradedBody:
        "دسترسی به کتابخانهٔ جامعه ممکن نشد، بنابراین این فهرست‌ها نمونه هستند.",
      retry: "تلاش دوباره",
      retrying: "در حال تلاش…",
      loadingFeatured: "در حال بارگذاری منابع منتخب",
      loadingCreators: "در حال بارگذاری سازندگان منتخب",
      loadingPractice: "در حال بارگذاری حوزه‌های کاری",
      emptyFeaturedTitle: "هنوز منبع منتخبی نیست",
      emptyFeaturedBody:
        "منابع منتخب پس از بازبینی انتخاب می‌شوند. تا آن زمان همهٔ فهرست در دسترس است.",
      emptyFeaturedCta: "دیدن همه",
      emptyCreatorsTitle: "هنوز پروفایل سازنده‌ای نیست",
      emptyCreatorsBody:
        "نخستین سازندگان منتشرشده اینجا دیده می‌شوند. شما هم می‌توانید یکی از آن‌ها باشید.",
      emptyCreatorsCta: "کارتان را منتشر کنید",
      emptyPracticeTitle: "هنوز حوزهٔ کاری ثبت نشده",
      emptyPracticeBody:
        "حوزه‌ها پس از انتشار منابع در آن‌ها نمایان می‌شوند.",
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
  },
} as const;
