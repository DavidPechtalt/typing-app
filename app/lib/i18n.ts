// All the words the interface shows, in English and Hebrew.
// No library: a dictionary per language and a tiny `translate` function.
// Keys are flat ("nav.practice") so TypeScript can check every key exists.

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

// Hebrew reads right to left; the <html dir> attribute comes from here.
export function directionOf(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}

const en = {
  "nav.practice": "Practice",
  "nav.texts": "Texts",
  "nav.history": "History",
  "nav.admin": "Admin",
  "nav.login": "Log in",
  "nav.register": "Register",
  "nav.logout": "Log out",
  "nav.language": "Language",
  "footer.tagline": "Keystroke · a typing practice app",
  "footer.credit": "Random texts come from {wikipedia}, CC BY-SA.",

  "error.title": "Error",
  "error.404": "The requested page could not be found.",
  "error.403": "You don't have permission to open this page.",
  "error.generic": "An unexpected error occurred.",
  "error.back": "Back to the start",

  "home.eyebrow": "Typing practice",
  "home.title.1": "Type faster,",
  "home.title.2": "one character",
  "home.title.3": "at a time.",
  "home.lead":
    "Live feedback on every key, real texts worth reading, and a record of how your speed and accuracy change over time.",
  "home.start": "Start practising",
  "home.randomWiki": "Random Wikipedia article",
  "home.specimen": "Sample",
  "home.wpm": "words per minute",
  "home.how": "How it works",
  "home.step1.title": "Pick a text",
  "home.step1.body":
    "A built-in passage, one you pasted yourself, or a random Wikipedia article in English or Hebrew.",
  "home.step2.title": "Type it",
  "home.step2.body":
    "Every character is checked as you go. Wrong keys turn red, corrected ones are underlined, and the highlight shows what comes next.",
  "home.step3.title": "Read the numbers",
  "home.step3.body":
    "Words per minute, accuracy, mistakes and corrections, kept in your history so you can see yourself improve.",
  "home.honest": "Honest statistics",
  "home.wpmDef":
    "Correct characters ÷ 5 ÷ minutes. The standard definition, so the number compares with everything else you have read.",
  "home.mistakesDef":
    "Any position you ever typed wrong, even if you fixed it. Accuracy counts first-try hits only, so the two numbers always agree, and fixing a typo never hides it.",

  "practice.eyebrow": "Practice",
  "practice.next": "Next text",
  "practice.nextArticle": "Next article",
  "practice.library": "Library",
  "practice.chars": "{n} characters",
  "practice.clickToStart": "Click here and start typing",
  "practice.inputLabel": "Type the practice passage",
  "practice.legend.wrong": "Wrong",
  "practice.legend.corrected": "Corrected",
  "practice.legend.next": "Next character",
  "practice.results": "Typing results",
  "practice.finished": "{n} words per minute",
  "practice.accuracy": "Accuracy",
  "practice.mistakes": "Mistakes",
  "practice.corrected": "Corrected",
  "practice.charsPerSec": "Chars / sec",
  "practice.again": "Type it again",
  "practice.choose": "Choose a text",
  "practice.saving": "Saving your result…",
  "practice.saved": "Saved to your history.",
  "practice.loginToSave": "{login} to save your results.",
  "practice.loginLink": "Log in",
  "practice.saveFailed": "Could not save this result.",
  "practice.notFound": "This text no longer exists.",
  "practice.noTexts": "No practice texts yet. Run `npm run db:seed`.",
  "source.BUILTIN": "Built-in",
  "source.UPLOAD": "Uploaded",
  "source.WIKIPEDIA": "Wikipedia",
  "source.link": "Wikipedia ↗",
  "lang.en": "English",
  "lang.he": "Hebrew",

  "texts.title": "Texts",
  "texts.aside": "Choose what to type",
  "texts.lead":
    "Pick a built-in passage, paste your own, or let Wikipedia surprise you.",
  "texts.wiki.eyebrow": "External source",
  "texts.wiki.title": "A random Wikipedia article",
  "texts.wiki.body":
    "The app asks Wikipedia for a random article summary, cleans it up, and turns it into a practice text. Each click is a new article.",
  "texts.wiki.en": "English article",
  "texts.wiki.he": "Hebrew article",
  "texts.wiki.fetching": "Fetching…",
  "texts.mine": "Your texts",
  "texts.upload": "Upload a text",
  "texts.loginToUpload": "Log in to upload",
  "texts.mine.empty":
    "You haven't uploaded any texts yet. Paste something you want to practise.",
  "texts.mine.guest": "Log in to upload your own texts and practise on them.",
  "texts.builtin": "Built-in texts",
  "texts.practise": "Practise",
  "texts.meta": "{chars} chars · {practices} practices · {date}",
  "texts.delete": "Delete text {title}",
  "texts.deleteConfirm":
    'Delete "{title}"? Its {n} practices will be deleted too.',
  "texts.err.id": "Invalid text id.",
  "texts.err.gone": "This text no longer exists.",

  "upload.title": "Upload a text",
  "upload.lead":
    "Paste anything you want to practise, or pick a plain text file. Between {min} and {max} characters.",
  "upload.titleLabel": "Title",
  "upload.language": "Language",
  "upload.text": "Text",
  "upload.placeholder": "Paste or type the passage here…",
  "upload.hint": "Line breaks and double spaces are turned into single spaces.",
  "upload.file": "…or choose a .txt file",
  "upload.fileHint": "If you choose a file, it replaces the pasted text.",
  "upload.submit": "Save and practise",
  "upload.submitting": "Saving…",
  "upload.err.title": "Give the text a title",
  "upload.err.language": "Choose a language",
  "upload.err.min": "The text must have at least {min} characters",
  "upload.err.max": "The text can have at most {max} characters",
  "upload.err.file": "The file is too big (max 64 KB).",

  "wiki.title": "Wikipedia",
  "wiki.failed": "That didn't work",
  "wiki.idle": "A random article",
  "wiki.idleBody":
    "Pick a language and the app fetches a random article summary to practise on.",
  "wiki.retry": "Try again",
  "wiki.back": "Back to texts",
  "wiki.err.language": "Unknown language.",
  "wiki.err.unreachable":
    "Could not reach Wikipedia. Check your connection and try again.",
  "wiki.err.noArticle":
    "Could not find a suitable article after several tries.",
  "wiki.err.status": "Wikipedia answered {status}.",

  "history.title": "Your history",
  "history.count.one": "1 practice",
  "history.count.other": "{n} practices",
  "history.empty.title": "Nothing here yet",
  "history.empty.body":
    "Finish a practice and it will show up here, with your speed and accuracy over time.",
  "history.start": "Start practising",
  "history.best": "Best WPM",
  "history.avgWpm": "Average WPM",
  "history.avgAccuracy": "Average accuracy",
  "history.time": "Time typing",
  "history.minutes": "{n} min",
  "history.chart.title": "Speed over time",
  "history.chart.desc":
    "Words per minute for your last {n} practices, oldest on the left.",
  "history.all": "All practices",
  "history.again": "Again",
  "col.date": "Date",
  "col.text": "Text",
  "col.user": "User",
  "col.wpm": "WPM",
  "col.accuracy": "Accuracy",
  "col.mistakes": "Mistakes",
  "col.corrected": "Corrected",
  "col.time": "Time",
  "col.email": "Email",
  "col.role": "Role",
  "col.joined": "Joined",
  "col.texts": "Texts",
  "col.practices": "Practices",
  "col.actions": "Actions",

  "login.title": "Log in",
  "login.lead": "Welcome back. Pick up where you left off.",
  "login.submit": "Log in",
  "login.submitting": "Logging in…",
  "login.noAccount": "No account yet?",
  "login.register": "Register",
  "login.err.wrong": "Wrong email or password",
  "login.err.password": "Enter your password",
  "register.title": "Create an account",
  "register.lead": "Save your results and track your progress.",
  "register.submit": "Create account",
  "register.submitting": "Creating account…",
  "register.hasAccount": "Already have an account?",
  "register.login": "Log in",
  "register.err.taken": "This email is already registered",
  "register.err.password": "Password must be at least 8 characters",
  "register.passwordHint": "At least 8 characters.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.err.email": "Enter a valid email address",

  "admin.title": "Admin",
  "admin.signedInAs": "Signed in as {email}",
  "admin.tab.overview": "Overview",
  "admin.tab.stats": "Statistics",
  "admin.tab.users": "Users",
  "admin.tab.texts": "Texts",
  "admin.tab.practices": "Practices",
  "admin.users.desc": "Registered accounts",
  "admin.texts.desc": "Built-in, uploaded and Wikipedia texts",
  "admin.practices.desc": "Finished practices saved",
  "admin.statsLink":
    "Charts of practices, speed, sign-ups and texts over the last 30 days.",
  "admin.users.count.one": "1 account",
  "admin.users.count.other": "{n} accounts",
  "admin.role.admin": "Admin",
  "admin.role.user": "User",
  "admin.protected": "Protected",
  "admin.users.delete": "Delete user {email}",
  "admin.users.deleteConfirm":
    "Delete {email}? Their {texts} texts and {practices} practices will be deleted too.",
  "admin.users.err.id": "Invalid user id.",
  "admin.users.err.gone": "This user no longer exists.",
  "admin.users.err.admin": "Admin accounts can't be deleted.",
  "admin.texts.count.one": "1 text",
  "admin.texts.count.other": "{n} texts",
  "admin.texts.empty":
    "No texts yet. Run `npm run db:seed` to add the built-in ones.",
  "admin.texts.noOwner": "No owner",
  "admin.texts.meta":
    "{owner} · added {date} · {chars} characters · {practices} practices",
  "admin.texts.source": "source ↗",
  "admin.texts.show": "Show full text",
  "admin.texts.hide": "Hide text",
  "admin.results.latest": "Latest {n} of {total}",
  "admin.results.count.one": "1 practice",
  "admin.results.count.other": "{n} practices",
  "admin.results.empty": "No practices saved yet.",
  "admin.results.delete": "Delete practice by {email} on {date}",
  "admin.results.deleteConfirm": "Delete this practice by {email}?",
  "admin.results.err.id": "Invalid practice id.",
  "admin.results.err.gone": "This practice no longer exists.",
  "admin.stats.title": "Statistics",
  "admin.stats.lastDays": "Last {n} days",
  "admin.stats.users": "Users",
  "admin.stats.active": "Active users",
  "admin.stats.activeHint": "practised in {n} days",
  "admin.stats.practices": "Practices",
  "admin.stats.texts": "Texts",
  "admin.stats.avgWpm": "Avg WPM",
  "admin.stats.allTime": "all time",
  "admin.stats.avgAccuracy": "Avg accuracy",
  "admin.stats.lastDaysHint": "last {n} days",
  "admin.stats.perDay.title": "Practices per day",
  "admin.stats.perDay.desc": "Finished practices saved each day.",
  "admin.stats.speed.title": "Average speed per day",
  "admin.stats.speed.desc":
    "Mean words per minute of all practices that day. Gaps are days with no practices.",
  "admin.stats.signups.title": "New users per day",
  "admin.stats.signups.desc": "Accounts registered each day.",
  "admin.stats.dist.title": "Speed distribution",
  "admin.stats.dist.desc":
    "How many practices fall in each {n}-WPM band, all time.",
  "admin.stats.top.title": "Most practised texts",
  "admin.stats.top.desc": "Texts ranked by the number of saved practices.",
  "admin.stats.bySource.title": "Texts by source",
  "admin.stats.bySource.desc":
    "Built-in, uploaded by users, or fetched from Wikipedia.",
  "admin.stats.byLang.title": "Texts by language",
  "admin.stats.wpmUnit": "{n} wpm",

  "chart.table": "Show as table",
  "chart.label": "Label",
  "chart.value": "Value",
  "chart.noData": "no data",
  "chart.empty": "Nothing to show yet.",
  delete: "Delete",
  deleting: "Deleting…",
};

export type TranslationKey = keyof typeof en;
type Dictionary = Record<TranslationKey, string>;

const he: Dictionary = {
  "nav.practice": "תרגול",
  "nav.texts": "טקסטים",
  "nav.history": "היסטוריה",
  "nav.admin": "ניהול",
  "nav.login": "התחברות",
  "nav.register": "הרשמה",
  "nav.logout": "התנתקות",
  "nav.language": "שפה",
  "footer.tagline": "Keystroke · אפליקציה לתרגול הקלדה",
  "footer.credit": "טקסטים אקראיים מגיעים מ‑{wikipedia}, CC BY-SA.",

  "error.title": "שגיאה",
  "error.404": "הדף המבוקש לא נמצא.",
  "error.403": "אין לך הרשאה לפתוח את הדף הזה.",
  "error.generic": "אירעה שגיאה לא צפויה.",
  "error.back": "חזרה להתחלה",

  "home.eyebrow": "תרגול הקלדה",
  "home.title.1": "להקליד מהר יותר,",
  "home.title.2": "תו אחד",
  "home.title.3": "בכל פעם.",
  "home.lead":
    "משוב מיידי על כל הקשה, טקסטים אמיתיים ששווה לקרוא, ותיעוד של המהירות והדיוק שלך לאורך זמן.",
  "home.start": "להתחיל לתרגל",
  "home.randomWiki": "ערך אקראי מוויקיפדיה",
  "home.specimen": "דוגמה",
  "home.wpm": "מילים לדקה",
  "home.how": "איך זה עובד",
  "home.step1.title": "בוחרים טקסט",
  "home.step1.body":
    "קטע מובנה, טקסט שהדבקת בעצמך, או ערך אקראי מוויקיפדיה בעברית או באנגלית.",
  "home.step2.title": "מקלידים",
  "home.step2.body":
    "כל תו נבדק תוך כדי הקלדה. מקש שגוי נצבע באדום, תו שתוקן מסומן בקו תחתון, וההדגשה מראה מה התו הבא.",
  "home.step3.title": "קוראים את המספרים",
  "home.step3.body":
    "מילים לדקה, דיוק, טעויות ותיקונים, שנשמרים בהיסטוריה שלך כדי שתוכלו לראות שיפור.",
  "home.honest": "סטטיסטיקה הוגנת",
  "home.wpmDef":
    "תווים נכונים ÷ 5 ÷ דקות. ההגדרה המקובלת, כך שאפשר להשוות את המספר לכל מקום אחר.",
  "home.mistakesDef":
    "כל מיקום שהוקלד לא נכון אי פעם, גם אם תוקן. הדיוק סופר רק פגיעות בניסיון הראשון, ולכן שני המספרים תמיד מסכימים, ותיקון טעות לא מסתיר אותה.",

  "practice.eyebrow": "תרגול",
  "practice.next": "טקסט הבא",
  "practice.nextArticle": "ערך הבא",
  "practice.library": "ספרייה",
  "practice.chars": "{n} תווים",
  "practice.clickToStart": "לחצו כאן והתחילו להקליד",
  "practice.inputLabel": "הקלידו את קטע התרגול",
  "practice.legend.wrong": "שגוי",
  "practice.legend.corrected": "תוקן",
  "practice.legend.next": "התו הבא",
  "practice.results": "תוצאות ההקלדה",
  "practice.finished": "{n} מילים לדקה",
  "practice.accuracy": "דיוק",
  "practice.mistakes": "טעויות",
  "practice.corrected": "תוקנו",
  "practice.charsPerSec": "תווים / שנייה",
  "practice.again": "להקליד שוב",
  "practice.choose": "לבחור טקסט",
  "practice.saving": "שומר את התוצאה…",
  "practice.saved": "נשמר בהיסטוריה שלך.",
  "practice.loginToSave": "{login} כדי לשמור תוצאות.",
  "practice.loginLink": "התחברו",
  "practice.saveFailed": "לא ניתן היה לשמור את התוצאה.",
  "practice.notFound": "הטקסט הזה כבר לא קיים.",
  "practice.noTexts": "אין עדיין טקסטים לתרגול. הריצו `npm run db:seed`.",
  "source.BUILTIN": "מובנה",
  "source.UPLOAD": "הועלה",
  "source.WIKIPEDIA": "ויקיפדיה",
  "source.link": "ויקיפדיה ↗",
  "lang.en": "אנגלית",
  "lang.he": "עברית",

  "texts.title": "טקסטים",
  "texts.aside": "בחרו מה להקליד",
  "texts.lead":
    "בחרו קטע מובנה, הדביקו טקסט משלכם, או תנו לוויקיפדיה להפתיע אתכם.",
  "texts.wiki.eyebrow": "מקור חיצוני",
  "texts.wiki.title": "ערך אקראי מוויקיפדיה",
  "texts.wiki.body":
    "האפליקציה מבקשת מוויקיפדיה תקציר של ערך אקראי, מנקה אותו והופכת אותו לטקסט תרגול. כל לחיצה היא ערך חדש.",
  "texts.wiki.en": "ערך באנגלית",
  "texts.wiki.he": "ערך בעברית",
  "texts.wiki.fetching": "מביא…",
  "texts.mine": "הטקסטים שלך",
  "texts.upload": "העלאת טקסט",
  "texts.loginToUpload": "התחברו כדי להעלות",
  "texts.mine.empty": "עדיין לא העליתם טקסטים. הדביקו משהו שתרצו לתרגל.",
  "texts.mine.guest": "התחברו כדי להעלות טקסטים משלכם ולתרגל עליהם.",
  "texts.builtin": "טקסטים מובנים",
  "texts.practise": "לתרגל",
  "texts.meta": "{chars} תווים · {practices} תרגולים · {date}",
  "texts.delete": "מחיקת הטקסט {title}",
  "texts.deleteConfirm": 'למחוק את "{title}"? גם {n} התרגולים שלו יימחקו.',
  "texts.err.id": "מזהה טקסט לא תקין.",
  "texts.err.gone": "הטקסט הזה כבר לא קיים.",

  "upload.title": "העלאת טקסט",
  "upload.lead":
    "הדביקו כל דבר שתרצו לתרגל, או בחרו קובץ טקסט. בין {min} ל‑{max} תווים.",
  "upload.titleLabel": "כותרת",
  "upload.language": "שפה",
  "upload.text": "טקסט",
  "upload.placeholder": "הדביקו או הקלידו כאן את הקטע…",
  "upload.hint": "מעברי שורה ורווחים כפולים הופכים לרווח בודד.",
  "upload.file": "…או בחרו קובץ ‎.txt",
  "upload.fileHint": "אם בוחרים קובץ, הוא מחליף את הטקסט שהודבק.",
  "upload.submit": "לשמור ולתרגל",
  "upload.submitting": "שומר…",
  "upload.err.title": "תנו לטקסט כותרת",
  "upload.err.language": "בחרו שפה",
  "upload.err.min": "הטקסט חייב להכיל לפחות {min} תווים",
  "upload.err.max": "הטקסט יכול להכיל לכל היותר {max} תווים",
  "upload.err.file": "הקובץ גדול מדי (עד 64 KB).",

  "wiki.title": "ויקיפדיה",
  "wiki.failed": "זה לא עבד",
  "wiki.idle": "ערך אקראי",
  "wiki.idleBody": "בחרו שפה והאפליקציה תביא תקציר של ערך אקראי לתרגול.",
  "wiki.retry": "לנסות שוב",
  "wiki.back": "חזרה לטקסטים",
  "wiki.err.language": "שפה לא מוכרת.",
  "wiki.err.unreachable": "לא ניתן להגיע לוויקיפדיה. בדקו את החיבור ונסו שוב.",
  "wiki.err.noArticle": "לא נמצא ערך מתאים אחרי כמה ניסיונות.",
  "wiki.err.status": "ויקיפדיה ענתה {status}.",

  "history.title": "ההיסטוריה שלך",
  "history.count.one": "תרגול אחד",
  "history.count.other": "{n} תרגולים",
  "history.empty.title": "עדיין אין כאן כלום",
  "history.empty.body":
    "סיימו תרגול והוא יופיע כאן, עם המהירות והדיוק שלכם לאורך זמן.",
  "history.start": "להתחיל לתרגל",
  "history.best": "שיא מילים לדקה",
  "history.avgWpm": "ממוצע מילים לדקה",
  "history.avgAccuracy": "דיוק ממוצע",
  "history.time": "זמן הקלדה",
  "history.minutes": "{n} דק׳",
  "history.chart.title": "מהירות לאורך זמן",
  "history.chart.desc":
    "מילים לדקה ב‑{n} התרגולים האחרונים שלך, הישן ביותר משמאל.",
  "history.all": "כל התרגולים",
  "history.again": "שוב",
  "col.date": "תאריך",
  "col.text": "טקסט",
  "col.user": "משתמש",
  "col.wpm": "מל״ד",
  "col.accuracy": "דיוק",
  "col.mistakes": "טעויות",
  "col.corrected": "תוקנו",
  "col.time": "זמן",
  "col.email": "אימייל",
  "col.role": "תפקיד",
  "col.joined": "הצטרפות",
  "col.texts": "טקסטים",
  "col.practices": "תרגולים",
  "col.actions": "פעולות",

  "login.title": "התחברות",
  "login.lead": "ברוכים השבים. ממשיכים מאיפה שעצרתם.",
  "login.submit": "להתחבר",
  "login.submitting": "מתחבר…",
  "login.noAccount": "עדיין אין חשבון?",
  "login.register": "הרשמה",
  "login.err.wrong": "אימייל או סיסמה שגויים",
  "login.err.password": "הזינו את הסיסמה",
  "register.title": "יצירת חשבון",
  "register.lead": "שמרו את התוצאות ועקבו אחרי ההתקדמות.",
  "register.submit": "ליצור חשבון",
  "register.submitting": "יוצר חשבון…",
  "register.hasAccount": "כבר יש לכם חשבון?",
  "register.login": "התחברות",
  "register.err.taken": "האימייל הזה כבר רשום",
  "register.err.password": "הסיסמה חייבת להכיל לפחות 8 תווים",
  "register.passwordHint": "לפחות 8 תווים.",
  "auth.email": "אימייל",
  "auth.password": "סיסמה",
  "auth.err.email": "הזינו כתובת אימייל תקינה",

  "admin.title": "ניהול",
  "admin.signedInAs": "מחובר בתור {email}",
  "admin.tab.overview": "סקירה",
  "admin.tab.stats": "סטטיסטיקה",
  "admin.tab.users": "משתמשים",
  "admin.tab.texts": "טקסטים",
  "admin.tab.practices": "תרגולים",
  "admin.users.desc": "חשבונות רשומים",
  "admin.texts.desc": "טקסטים מובנים, שהועלו ומוויקיפדיה",
  "admin.practices.desc": "תרגולים שהסתיימו ונשמרו",
  "admin.statsLink":
    "גרפים של תרגולים, מהירות, הרשמות וטקסטים ב‑30 הימים האחרונים.",
  "admin.users.count.one": "חשבון אחד",
  "admin.users.count.other": "{n} חשבונות",
  "admin.role.admin": "מנהל",
  "admin.role.user": "משתמש",
  "admin.protected": "מוגן",
  "admin.users.delete": "מחיקת המשתמש {email}",
  "admin.users.deleteConfirm":
    "למחוק את {email}? גם {texts} הטקסטים ו‑{practices} התרגולים שלו יימחקו.",
  "admin.users.err.id": "מזהה משתמש לא תקין.",
  "admin.users.err.gone": "המשתמש הזה כבר לא קיים.",
  "admin.users.err.admin": "אי אפשר למחוק חשבונות מנהל.",
  "admin.texts.count.one": "טקסט אחד",
  "admin.texts.count.other": "{n} טקסטים",
  "admin.texts.empty":
    "אין עדיין טקסטים. הריצו `npm run db:seed` כדי להוסיף את המובנים.",
  "admin.texts.noOwner": "ללא בעלים",
  "admin.texts.meta":
    "{owner} · נוסף {date} · {chars} תווים · {practices} תרגולים",
  "admin.texts.source": "מקור ↗",
  "admin.texts.show": "הצגת הטקסט המלא",
  "admin.texts.hide": "הסתרת הטקסט",
  "admin.results.latest": "{n} האחרונים מתוך {total}",
  "admin.results.count.one": "תרגול אחד",
  "admin.results.count.other": "{n} תרגולים",
  "admin.results.empty": "עדיין לא נשמרו תרגולים.",
  "admin.results.delete": "מחיקת התרגול של {email} מ‑{date}",
  "admin.results.deleteConfirm": "למחוק את התרגול הזה של {email}?",
  "admin.results.err.id": "מזהה תרגול לא תקין.",
  "admin.results.err.gone": "התרגול הזה כבר לא קיים.",
  "admin.stats.title": "סטטיסטיקה",
  "admin.stats.lastDays": "{n} הימים האחרונים",
  "admin.stats.users": "משתמשים",
  "admin.stats.active": "משתמשים פעילים",
  "admin.stats.activeHint": "תרגלו ב‑{n} הימים האחרונים",
  "admin.stats.practices": "תרגולים",
  "admin.stats.texts": "טקסטים",
  "admin.stats.avgWpm": "ממוצע מל״ד",
  "admin.stats.allTime": "כל הזמנים",
  "admin.stats.avgAccuracy": "דיוק ממוצע",
  "admin.stats.lastDaysHint": "{n} הימים האחרונים",
  "admin.stats.perDay.title": "תרגולים ליום",
  "admin.stats.perDay.desc": "תרגולים שהסתיימו ונשמרו בכל יום.",
  "admin.stats.speed.title": "מהירות ממוצעת ליום",
  "admin.stats.speed.desc":
    "ממוצע מילים לדקה של כל התרגולים באותו יום. פערים הם ימים ללא תרגולים.",
  "admin.stats.signups.title": "משתמשים חדשים ליום",
  "admin.stats.signups.desc": "חשבונות שנרשמו בכל יום.",
  "admin.stats.dist.title": "התפלגות מהירות",
  "admin.stats.dist.desc":
    "כמה תרגולים נופלים בכל טווח של {n} מילים לדקה, כל הזמנים.",
  "admin.stats.top.title": "הטקסטים המתורגלים ביותר",
  "admin.stats.top.desc": "טקסטים מדורגים לפי מספר התרגולים שנשמרו.",
  "admin.stats.bySource.title": "טקסטים לפי מקור",
  "admin.stats.bySource.desc":
    "מובנים, הועלו על ידי משתמשים, או הובאו מוויקיפדיה.",
  "admin.stats.byLang.title": "טקסטים לפי שפה",
  "admin.stats.wpmUnit": "{n} מל״ד",

  "chart.table": "הצגה כטבלה",
  "chart.label": "תווית",
  "chart.value": "ערך",
  "chart.noData": "אין נתונים",
  "chart.empty": "אין עדיין מה להציג.",
  delete: "מחיקה",
  deleting: "מוחק…",
};

const dictionaries: Record<Locale, Dictionary> = { en, he };

export type TranslateVars = Record<string, string | number>;

// Looks a key up and fills in {placeholders}: translate("he", "practice.chars", { n: 42 }).
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars: TranslateVars = {},
): string {
  const template = dictionaries[locale][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

// A translate function bound to one locale, so pages write t("key") only.
export type Translate = (key: TranslationKey, vars?: TranslateVars) => string;

export function translator(locale: Locale): Translate {
  return (key, vars) => translate(locale, key, vars);
}

// "1 practice" / "{n} practices" picked by the number.
export function plural(
  t: Translate,
  base:
    | "history.count"
    | "admin.users.count"
    | "admin.texts.count"
    | "admin.results.count",
  n: number,
): string {
  return n === 1 ? t(`${base}.one`) : t(`${base}.other`, { n });
}
