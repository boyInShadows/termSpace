export const reviewCopy = {
  en: {
    title: "Your review", retry: "Retry", signIn: "Log in to review this listing.", signInLink: "Log in",
    notAcquired: "Add this listing to your library to review it.", ownListing: "You can't review your own listing.",
    verify: "Verify your email to write a review.", loading: "Checking whether you can review this listing…",
    rating: "Your rating", needRating: "Choose a rating from 1 to 5.", stars: "{count} out of 5", name: "Name shown with your review", nameHint: "This is not your email address.",
    body: "Your review", bodyHint: "{count} / 2000", post: "Post review", update: "Update review", saving: "Saving…",
    remove: "Delete review", confirmRemove: "Delete your review?", saved: "Review saved.", removed: "Review deleted.",
    hidden: "A moderator hid your review, so it can't be edited or deleted.", reason: "Reason",
    tooMany: "Too many review changes. Try again later.", loadFailed: "Couldn't check your review status.",
  },
  fa: {
    title: "نقد شما", retry: "تلاش دوباره", signIn: "برای نقد این فهرست وارد شوید.", signInLink: "ورود",
    notAcquired: "برای نقد این فهرست، آن را به کتابخانهٔ خود اضافه کنید.", ownListing: "نمی‌توانید فهرست خودتان را نقد کنید.",
    verify: "برای نوشتن نقد، ایمیل خود را تأیید کنید.", loading: "در حال بررسی امکان نقد این فهرست…",
    rating: "امتیاز شما", needRating: "امتیازی از ۱ تا ۵ انتخاب کنید.", stars: "{count} از ۵", name: "نامی که کنار نقد نمایش داده می‌شود", nameHint: "این نشانی ایمیل شما نیست.",
    body: "نقد شما", bodyHint: "{count} / ۲۰۰۰", post: "ثبت نقد", update: "به‌روزرسانی نقد", saving: "در حال ذخیره…",
    remove: "حذف نقد", confirmRemove: "نقد شما حذف شود؟", saved: "نقد ذخیره شد.", removed: "نقد حذف شد.",
    hidden: "یک ناظر نقد شما را پنهان کرده است و قابل ویرایش یا حذف نیست.", reason: "دلیل",
    tooMany: "تعداد تغییرات نقد زیاد بود. بعداً دوباره تلاش کنید.", loadFailed: "بررسی وضعیت نقد شما ممکن نشد.",
  },
};

export type ReviewMessages = typeof reviewCopy.en;
