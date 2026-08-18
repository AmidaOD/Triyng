/**
 * The event deck.
 *
 * Each entry is one chapter of a life. `stage` is the inclusive age window in
 * which it can fire; `paths` restricts it to a playstyle; `weight` biases the
 * draw. Outcomes are ordered best → worst — the `luck` trait bends the roll
 * toward the top of the list.
 *
 * effect keys: health, sanity, career (0–100 gauges) · capital ($) · mult (score multiplier)
 */

export const CRISIS_AGES = { cancer: 30, crash: 41 };

export const EVENTS = [

  /* ══════════════ לידה 0–5 ══════════════ */
  {
    id: 'birth', stage: [0, 2], years: 4, weight: 10,
    title: 'הפרק הראשון',
    text: 'הזהות נטבעה. הבלוק אישר. עכשיו צריך להחליט לתוך מה נולדת — זה לא באמת בידיים שלך, אבל הארקייד נותן לך לבחור.',
    choices: [
      { label: 'פרברים שקטים. שני הורים, חוב אחד', tag: 'safe', outcomes: [
        { p: 1, text: 'רחוב עם עצים ומכסחת דשא בשבת בבוקר. שום דבר דרמטי לא קורה, וזה בדיוק היתרון.', eff: { sanity: 6, capital: 4000, career: 2 }, flags: ['suburb'], score: 20 },
      ]},
      { label: 'אמא לבד, שתי עבודות', tag: 'risk', outcomes: [
        { p: 1, text: 'למדת להכין ארוחת ערב בגיל שבע ולהתמודד בגיל תשע. זה עלה בשקט־נפשי והחזיר בעמוד שדרה.', eff: { sanity: -6, career: 6, health: -2, mult: .1 }, flags: ['scrappy'], score: 30 },
      ]},
      { label: 'משפחת מהגרים בעיר גדולה', tag: 'risk', outcomes: [
        { p: 1, text: 'שתי שפות, שני שמות ותחושה קבועה שאתה צריך להוכיח משהו. זה יניע אותך ארבעים שנה.', eff: { career: 8, sanity: -3, capital: -2000, mult: .12 }, flags: ['hustler'], score: 35 },
      ]},
    ],
  },
  {
    id: 'kid_memory', stage: [4, 7], years: 3, weight: 3,
    title: 'הזיכרון הראשון',
    text: 'משהו מגיל ארבע נשאר איתך לתמיד. הארקייד שואל מה.',
    choices: [
      { label: 'אבא מרים אותך מעל הקהל במשחק', tag: 'safe', outcomes: [
        { p: 1, text: 'הרעש, הריח, היד על הצלעות. תחפש את התחושה הזאת בכל דבר שתעשה.', eff: { sanity: 8, career: 2 }, flags: ['warm_start'], score: 25 },
      ]},
      { label: 'דלת נטרקת ורכב שיוצא בלילה', tag: 'risk', outcomes: [
        { p: 1, text: 'לא הבנת מה קרה, אבל הבנת שאנשים עוזבים. הכנת את עצמך לזה כל החיים.', eff: { sanity: -8, career: 5, mult: .08 }, flags: ['guarded'], score: 25 },
      ]},
    ],
  },

  /* ══════════════ ילדות 4–12 ══════════════ */
  {
    id: 'kid_tree', stage: [4, 8], years: 3, weight: 3,
    title: 'העץ בחצר האחורית',
    text: 'הילדים הגדולים אומרים שאף אחד לא הגיע לענף העליון. אתה בן שש, והסולם כבר מתחת לרגליים שלך.',
    choices: [
      { label: 'לטפס עד למעלה', tag: 'risk', outcomes: [
        { p: .6, text: 'הגעת. השכונה כולה ראתה. משהו בפנים החליט באותו רגע שאתה לא מפחד.', eff: { sanity: 6, career: 3, mult: .05 }, flags: ['brave'], score: 30 },
        { p: .4, text: 'הענף נשבר. גבס בזרוע לשישה שבועות והורים שמסתכלים עליך אחרת.', eff: { health: -12, sanity: -4 }, score: 5 },
      ]},
      { label: 'להישאר על הדשא ולצייר את העץ', tag: 'safe', outcomes: [
        { p: 1, text: 'הציור נתלה על המקרר. אתה זוכר את זה יותר טוב מאיך שהיה מרגיש הענף.', eff: { sanity: 8, career: 1 }, score: 20 },
      ]},
    ],
  },
  {
    id: 'kid_dog', stage: [5, 10], years: 3, weight: 2,
    title: 'הכלב מהמקלט',
    text: 'אבא עוצר ליד השלט "גורים — חינם". הוא לא מכבה את המנוע.',
    choices: [
      { label: 'להתחנן עד שהוא מכבה', tag: 'safe', outcomes: [
        { p: 1, text: 'קראת לו באדי. הוא ילווה אותך תשע שנים, וכל אחת מהן תעשה אותך אדם קצת יותר טוב.', eff: { sanity: 12, health: 4 }, item: 'dog', flags: ['dog'], score: 40 },
      ]},
      { label: 'לא להגיד כלום', tag: 'safe', outcomes: [
        { p: 1, text: 'הוא ממשיך לנסוע. למדת מוקדם מדי שדברים שרוצים פשוט חולפים.', eff: { sanity: -5, career: 2 }, score: 10 },
      ]},
    ],
  },
  {
    id: 'kid_lemonade', stage: [7, 12], years: 3, weight: 2,
    title: 'דוכן הלימונדה',
    text: 'ארבעים סנט לכוס. בסוף היום יש בקופסת הנעליים אחד עשר דולר.',
    choices: [
      { label: 'להשקיע הכל בעוד לימונים', tag: 'risk', outcomes: [
        { p: .65, text: 'בשבוע השני יש לך שלושה דוכנים ושני עובדים בני שמונה. אתה מגלה שכסף עושה כסף.', eff: { career: 8, capital: 60, mult: .05 }, flags: ['hustler'], score: 45 },
        { p: .35, text: 'ירד גשם שישה ימים ברצף. הלימונים נרקבו. שיעור ראשון בסיכון.', eff: { capital: -20, sanity: -3, career: 3 }, score: 15 },
      ]},
      { label: 'לקנות אופניים משומשים', tag: 'safe', outcomes: [
        { p: 1, text: 'האופניים החזיקו עד גיל חמש עשרה. הרגליים שלך למדו מה זה חופש.', eff: { health: 6, sanity: 6 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'kid_fight', stage: [9, 13], years: 3, weight: 2,
    title: 'הבריון של כיתה ו׳',
    text: 'הוא לקח לך את הכריך שלוש פעמים השבוע. היום כל המסדרון מסתכל.',
    choices: [
      { label: 'להחזיר מכה', tag: 'risk', outcomes: [
        { p: .55, text: 'אף מדמם — שלו. אף אחד לא נגע בך שוב עד סוף התיכון.', eff: { career: 6, sanity: 5, health: -5 }, flags: ['brave'], score: 35 },
        { p: .45, text: 'ספגת. השעייה של שלושה ימים ותיק שמלווה אותך.', eff: { health: -10, sanity: -8, career: -3 }, score: 5 },
      ]},
      { label: 'לספר למחנכת', tag: 'safe', outcomes: [
        { p: .7, text: 'זה נפסק. גם אם שילמת על זה במטבע חברתי.', eff: { sanity: 3, career: 2 }, score: 20 },
        { p: .3, text: 'זה החמיר. למדת שלמערכת יש גבולות.', eff: { sanity: -7 }, score: 10 },
      ]},
    ],
  },

  /* ══════════════ נעורים 14–18 ══════════════ */
  {
    id: 'hs_football', stage: [14, 17], years: 2, weight: 4,
    title: 'טרייאאוטים לנבחרת',
    text: 'המאמן קורא בשמך. הברך שמאל כואבת כבר שבועיים, ואתה לא אמרת לאף אחד.',
    choices: [
      { label: 'לרוץ בכל הכוח', tag: 'risk', outcomes: [
        { p: .5, text: 'ראנינג בק פותח. שנתיים של אורות ליל שישי שאתה עוד תספר עליהן בגיל שישים.', eff: { career: 14, sanity: 10, health: -4, mult: .08 }, flags: ['football'], milestone: 'כוכב הנבחרת', score: 70 },
        { p: .5, text: 'הרצועה הצולבת נקרעה בשנייה השמינית. אתה שומע את זה לפני שאתה מרגיש.', eff: { health: -20, sanity: -12, career: 2 }, flags: ['bad_knee'], score: 15 },
      ]},
      { label: 'לומר למאמן על הברך', tag: 'safe', outcomes: [
        { p: 1, text: 'ישבת על הספסל עונה שלמה. הברך החלימה. גם משהו אחר לא.', eff: { health: 5, sanity: -5, career: 3 }, score: 25 },
      ]},
      { label: 'לוותר ולעבוד אחרי הלימודים', tag: 'safe', outcomes: [
        { p: 1, text: 'שכר מינימום בסופר. בגיל שבע עשרה יש לך חסכונות ואף חבר.', eff: { capital: 3200, career: 6, sanity: -6 }, score: 30 },
      ]},
    ],
  },
  {
    id: 'hs_prom', stage: [16, 18], years: 2, weight: 3,
    title: 'נשף הסיום',
    text: 'היא אמרה כן. המכונית של אבא בחוץ, והמפתחות בכיס.',
    choices: [
      { label: 'ללכת, ולנהוג בזהירות', tag: 'safe', outcomes: [
        { p: 1, text: 'לילה שיישאר. אתם תיפרדו בקיץ, אבל התמונה תישאר על המדף שלושים שנה.', eff: { sanity: 14, career: 2 }, milestone: 'לילה מושלם', score: 45 },
      ]},
      { label: 'אחרי הנשף — לנהוג לחוף עם בירה', tag: 'degen', outcomes: [
        { p: .55, text: 'זריחה על החול. אף אחד לא נעצר, אף אחד לא נפגע, וכולכם צוחקים על זה עשרים שנה.', eff: { sanity: 18, health: -3, mult: .12 }, score: 60 },
        { p: .3, text: 'שוטר. בדיקת שכרות. רישיון מושעה ורישום פלילי קטן.', eff: { career: -8, capital: -1500, sanity: -6 }, flags: ['record'], score: 10 },
        { p: .15, text: 'עמוד חשמל בקילומטר האחרון. שלושה חודשים בשיקום.', eff: { health: -30, sanity: -14, capital: -6000 }, score: 0 },
      ]},
      { label: 'להישאר בבית ולהגיש מועמדות לקולג׳', tag: 'safe', outcomes: [
        { p: 1, text: 'שלוש מעטפות. אחת מהן עבה.', eff: { career: 10, sanity: -6 }, flags: ['college_offer'], score: 40 },
      ]},
    ],
  },
  {
    id: 'hs_job_offer', stage: [16, 18], years: 2, weight: 2,
    title: 'אבא של סטיב מחפש מוכר',
    text: '"חנות שטיחים היא לא חלום," הוא אומר, "אבל היא לא נעלמת."',
    choices: [
      { label: 'לקבל את המשמרות', tag: 'safe', outcomes: [
        { p: 1, text: 'למדת לזהות צמר מסינתטי בעיניים עצומות. זה יותר שימושי משזה נשמע.', eff: { career: 9, capital: 2400 }, flags: ['carpet_track'], score: 35 },
      ]},
      { label: 'לסרב. יש לך תוכניות אחרות', tag: 'risk', outcomes: [
        { p: 1, text: 'לא היו לך תוכניות אחרות. אבל היה לך כבוד עצמי, וזה נחשב.', eff: { sanity: 6, career: -2, mult: .05 }, score: 20 },
      ]},
    ],
  },

  /* ══════════════ בגרות מוקדמת 19–26 ══════════════ */
  {
    id: 'ya_ssn', stage: [19, 24], years: 2, weight: 6, paths: ['rick'],
    title: 'שרוף את המספר',
    text: 'אתה מחזיק בכרטיס הביטוח הלאומי שלך מעל הכיור. ברגע שהוא נשרף — אין רישום, אין מס, אין רשת ביטחון. אין גם רצועה.',
    choices: [
      { label: 'לשרוף. לצאת מהרשת', tag: 'degen', outcomes: [
        { p: .55, text: 'הזהות שלך נמחקה. שישה חודשים אחר כך אתה עובר את הגבול עם שם שהמצאת בתחנת דלק.', eff: { sanity: -10, career: -15, capital: 4000, mult: .5 }, item: 'burner_id', flags: ['off_grid'], milestone: 'Off the Grid', score: 120 },
        { p: .3, text: 'שרפת. אחר כך גילית שקשה לשכור דירה בלי מספר. שנתיים ברכב.', eff: { health: -12, sanity: -14, career: -20, mult: .35 }, flags: ['off_grid'], score: 60 },
        { p: .15, text: 'הלהבה תפסה את הווילון. הדירה עלתה באש, ואיתה כל מה שהיה לך.', eff: { health: -20, capital: -8000, sanity: -12, mult: .3 }, flags: ['off_grid'], score: 40 },
      ]},
      { label: 'להחזיר לארנק', tag: 'safe', outcomes: [
        { p: 1, text: 'החזרת. הכרטיס נשאר מקומט קצת. גם אתה.', eff: { sanity: -4, career: 4 }, score: 15 },
      ]},
    ],
  },
  {
    id: 'ya_college', stage: [19, 23], years: 4, weight: 4,
    title: 'ארבע שנים ושמונים אלף דולר',
    text: 'הקולג׳ מחכה. גם ההלוואה.',
    choices: [
      { label: 'ללכת ללמוד. לקחת את ההלוואה', tag: 'risk', outcomes: [
        { p: .7, text: 'תואר בעיניים, חוב על הגב. בשוק העבודה זה פותח דלתות שלא ידעת שקיימות.', eff: { career: 22, capital: -62000, sanity: 4 }, item: 'degree', flags: ['degree'], milestone: 'תואר ראשון', score: 80 },
        { p: .3, text: 'נשרת בשנה השלישית. החוב נשאר, התואר לא.', eff: { career: 4, capital: -38000, sanity: -12 }, score: 20 },
      ]},
      { label: 'משרה מלאה בחנות השטיחים', tag: 'safe', outcomes: [
        { p: 1, text: 'בגיל עשרים ושתיים אתה סגן מנהל. בלי חוב, בלי אשליות.', eff: { career: 14, capital: 9000 }, flags: ['carpet_track'], score: 50 },
      ]},
      { label: 'שנת טיולים בדרום אמריקה', tag: 'risk', outcomes: [
        { p: .6, text: 'חזרת רזה, שרוף ומלא סיפורים. משהו בך נפתח ולא נסגר.', eff: { sanity: 20, health: 6, career: -6, capital: -7000, mult: .15 }, milestone: 'שנת החופש', score: 65 },
        { p: .4, text: 'דלקת מעיים בבוליביה, שוד בקרקס, וטיסה הביתה שאמא שילמה עליה.', eff: { health: -16, sanity: 4, capital: -9000 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'ya_band', stage: [19, 25], years: 2, weight: 2,
    title: 'הלהקה של ג׳ף',
    text: 'הם צריכים בסיסט לסיבוב הופעות. שישה שבועות, ואן אחד, אפס תשלום מובטח.',
    choices: [
      { label: 'לעלות לוואן', tag: 'degen', outcomes: [
        { p: .45, text: 'ניגנתם מול ארבע מאות איש באוסטין. זה לא הפך לקריירה, אבל זה הפך לך את החיים.', eff: { sanity: 22, career: -5, capital: -1200, mult: .2 }, milestone: 'הסיבוב', score: 70 },
        { p: .55, text: 'הוואן התפרק בניו מקסיקו. חזרת באוטובוס עם בס שבור.', eff: { sanity: -8, capital: -2400, health: -5 }, score: 15 },
      ]},
      { label: 'להישאר בעבודה', tag: 'safe', outcomes: [
        { p: 1, text: 'קיבלת העלאה בדיוק בשבוע שהם עלו לבמה.', eff: { career: 8, capital: 3000, sanity: -4 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'ya_love', stage: [22, 30], years: 3, weight: 5,
    echo: [{ flag: 'guarded', note: 'הדלת שנטרקה כשהיית בן ארבע' },
           { flag: 'warm_start', note: 'איך שאבא הרים אותך מעל הקהל' }],
    title: 'היא שואלת לאן זה הולך',
    text: 'שנתיים ביחד. השאלה נשאלת בשקט, בין שתי כוסות קפה.',
    textIf: [
      { flag: 'guarded', text: 'שנתיים ביחד. היא שואלת בשקט, ואתה מרגיש את אותו דבר שהרגשת בגיל ארבע כשהרכב יצא בלילה — שכדאי להיות מוכן.' },
      { flag: 'warm_start', text: 'שנתיים ביחד. השאלה נשאלת בשקט, ואתה נזכר איך אבא הרים אותך מעל הקהל — שזה בדיוק מה שאתה רוצה לתת למישהו.' },
    ],
    choices: [
      { label: 'להציע נישואין', tag: 'safe', outcomes: [
        { p: .8, pIf: { warm_start: 1.4, grief_ok: 1.2, guarded: .6 },
          text: 'חתונה קטנה בחצר של ההורים שלה. זה יחזיק. לא בלי סדקים, אבל יחזיק.', eff: { sanity: 18, health: 5, capital: -12000, career: 4 }, flags: ['married'], milestone: 'נישואין', score: 90 },
        { p: .2, text: 'היא אמרה שהיא צריכה זמן. הזמן הפך לשנה, ואז לכתובת אחרת.', eff: { sanity: -16, career: 3 }, score: 20 },
      ]},
      { label: '"אני עוד לא יודע"', tag: 'risk', outcomes: [
        { p: .5, text: 'נפרדתם בכבוד. שניכם ידעתם שזאת הייתה התשובה.', eff: { sanity: -8, career: 8, mult: .08 }, score: 35 },
        { p: .5, text: 'היא נשארה עוד שנתיים, ואז עזבה בצורה שכאבה הרבה יותר.', eff: { sanity: -18, career: 5 }, score: 20 },
      ]},
      { label: 'לעזוב באותו לילה', tag: 'degen', outcomes: [
        { p: 1, text: 'ארזת תיק אחד. אף אחד לא באמת מבין למה, כולל אתה.', eff: { sanity: -12, career: 10, capital: 2000, mult: .18 }, flags: ['loner'], score: 45 },
      ]},
    ],
  },
  {
    id: 'ya_crypto', stage: [22, 34], years: 2, weight: 3,
    title: 'החבר מהצבא שולח לינק',
    text: '"תשמע, זה עדיין מוקדם." הלינק מוביל לתרשים שעולה בזווית שנראית לא חוקית.',
    choices: [
      { label: 'לשים 5% מהחסכונות', tag: 'risk', needs: { capital: 2000 }, outcomes: [
        { p: .5, text: 'פי שמונה בארבעה חודשים. מכרת חצי, ולמדת מה זה להיות בצד הנכון.', eff: { capital: 24000, sanity: 6, mult: .1 }, item: 'ledger', score: 60 },
        { p: .5, text: 'מינוס שמונים אחוז. מחקת את זה מהמסך ומהזיכרון.', eff: { capital: -6000, sanity: -8 }, score: 15 },
      ]},
      { label: 'הכל פנימה. מינוף', tag: 'degen', needs: { capital: 5000 }, outcomes: [
        { p: .3, text: 'ליקווידית את כל מי שהיה בצד השני. שבע ספרות, בן לילה.', eff: { capital: 320000, sanity: -10, mult: .45 }, item: 'ledger', flags: ['whale'], milestone: 'הטרייד', score: 200 },
        { p: .4, text: 'ליקווידציה בשלוש לפנות בוקר. הכל.', eff: { capital: -40000, sanity: -22, health: -6, mult: .2 }, flags: ['broke'], score: 30 },
        { p: .3, text: 'הבורסה קרסה עם הכסף בפנים. אין את מי לתבוע.', eff: { capital: -55000, sanity: -26, mult: .2 }, flags: ['broke'], score: 25 },
      ]},
      { label: 'למחוק את ההודעה', tag: 'safe', outcomes: [
        { p: 1, text: 'הוא הפסיק לכתוב אחרי חצי שנה. אתה ישן בסדר.', eff: { sanity: 5, capital: 1000 }, score: 20 },
      ]},
    ],
  },

  /* ══════════════ 27–40 ══════════════ */
  {
    id: 'ad_kids', stage: [27, 38], years: 3, weight: 4, requires: ['married'],
    title: 'שני קווים',
    text: 'היא מראה לך את המקל הלבן בלי לומר מילה.',
    choices: [
      { label: 'ללדת. להפוך לאבא', tag: 'safe', outcomes: [
        { p: 1, text: 'קוראים לה אמילי. בשלוש לפנות בוקר, כשהיא נרדמת עליך, אתה מבין שזה הציון האמיתי.', eff: { sanity: 16, health: -6, capital: -22000, career: 6 }, flags: ['kids'], milestone: 'אבא', score: 120 },
      ]},
      { label: 'להגיד שזה לא הזמן', tag: 'risk', outcomes: [
        { p: .45, text: 'החלטתם ביחד לחכות. שנתיים אחר כך זה קרה בכל זאת, והייתם מוכנים.', eff: { sanity: 6, capital: -14000, career: 10 }, flags: ['kids'], score: 70 },
        { p: .55, text: 'משהו נסדק ולא חזר. אתם ביחד, אבל רק על הנייר.', eff: { sanity: -18, career: 12 }, flags: ['cold_marriage'], score: 25 },
      ]},
    ],
  },
  {
    id: 'ad_carpet_own', stage: [28, 42], years: 3, weight: 4, requires: ['carpet_track'],
    title: 'הבעלים פורש',
    text: 'הוא מציע לך את החנות ב־140 אלף. אתה מכיר כל מטר בה.',
    choices: [
      { label: 'לקנות. לקחת הלוואה', tag: 'risk', outcomes: [
        { p: .7, text: '"שטיחים דודו" עם השם שלך על השלט. שמונה עובדים ולקוחות שחוזרים.', eff: { career: 26, capital: -70000, sanity: 10, mult: .12 }, item: 'carpet_shop', flags: ['owner'], milestone: 'בעל עסק', score: 130 },
        { p: .3, text: 'קנית שנה לפני שקניון נפתח שני רחובות משם. שנתיים של דימום.', eff: { career: 10, capital: -110000, sanity: -14 }, item: 'carpet_shop', flags: ['owner'], score: 45 },
      ]},
      { label: 'להישאר שכיר', tag: 'safe', outcomes: [
        { p: 1, text: 'הבעלים החדש הוא בן עשרים ושמונה מהעיר. אתה מלמד אותו מה זה שטיח.', eff: { career: 6, capital: 16000, sanity: -5 }, score: 40 },
      ]},
    ],
  },
  {
    id: 'ad_cartel', stage: [26, 44], years: 3, weight: 4, paths: ['rick'],
    title: 'המשלוח מטורקיה',
    text: 'הגלילים מגיעים תפורים. מה שבתוכם לא רשום בשטר המטען.',
    choices: [
      { label: 'להעביר את המשלוח', tag: 'degen', outcomes: [
        { p: .45, text: 'עמלה של ארבעים אלף על שלושה ימי עבודה. יש עוד משלוחים.', eff: { capital: 40000, sanity: -8, mult: .3 }, flags: ['smuggler'], score: 110 },
        { p: .3, text: 'המכס פתח גליל אקראי. עורך דין, ערבות, ותיק שנפתח.', eff: { capital: -60000, career: -18, sanity: -14, mult: .15 }, flags: ['record'], score: 35 },
        { p: .25, text: 'השותפים שלך החליטו שאתה חוליה מיותרת. מצאו אותך במחסן.', death: 'cartel', eff: { health: -100 }, score: 60 },
      ]},
      { label: 'לשרוף את המשלוח ולהעלם', tag: 'risk', outcomes: [
        { p: .6, text: 'שלושה חודשים במוטלים. אף אחד לא בא. אתה עדיין נבהל מדפיקות.', eff: { sanity: -12, capital: -5000, health: -4, mult: .12 }, score: 45 },
        { p: .4, text: 'הם באו. יצאת עם צלעות שבורות ואזהרה.', eff: { health: -28, sanity: -16 }, score: 25 },
      ]},
      { label: 'להתקשר למשטרה', tag: 'safe', outcomes: [
        { p: .55, text: 'עסקת עד מדינה. שם חדש, עיר חדשה, שקט.', eff: { career: -12, sanity: -6, capital: 8000 }, item: 'burner_id', score: 55 },
        { p: .45, text: 'המידע דלף לפני שהגיע לתיק. עכשיו שני צדדים מחפשים אותך.', eff: { sanity: -20, health: -12, capital: -3000 }, flags: ['hunted'], score: 30 },
      ]},
    ],
  },
  {
    id: 'ad_promotion', stage: [29, 46], years: 3, weight: 4,
    echo: [{ flag: 'degree', note: 'התואר ששילמת עליו' },
           { flag: 'hustler', note: 'דוכן הלימונדה מגיל שבע' }],
    title: 'קידום לניהול אזורי',
    text: 'משכורת כפולה, ארבעה לילות בשבוע מחוץ לבית.',
    textIf: [
      { flag: 'kids', text: 'משכורת כפולה, ארבעה לילות בשבוע מחוץ לבית. הבת שלך בת שש.' },
    ],
    choices: [
      { label: 'לקחת', tag: 'risk', outcomes: [
        { p: .6, pIf: { degree: 1.5, hustler: 1.3, record: .6, addiction: .5 },
          text: 'שלוש שנים של שיא. גם הבנק וגם המסך של הטלפון מלאים.', eff: { career: 20, capital: 90000, sanity: -10, health: -6 }, milestone: 'מנהל אזורי', score: 95 },
        { p: .4, text: 'עמדת ביעדים ואיבדת ארבע שנים מהילדות של הבת שלך.', eff: { career: 22, capital: 110000, sanity: -22, health: -10 }, flags: ['absent_parent'], score: 60 },
      ]},
      { label: 'לסרב ולהישאר קרוב לבית', tag: 'safe', outcomes: [
        { p: 1, text: 'אף אחד לא זוכר מי היה מנהל אזורי ב־2014. הבת שלך זוכרת מי הסיע אותה לחוגים.', eff: { sanity: 14, career: -4, health: 4 }, score: 65 },
      ]},
    ],
  },
  {
    id: 'ad_house', stage: [28, 44], years: 3, weight: 3,
    title: 'המשכנתא',
    text: 'שלושים שנה, ריבית משתנה, גינה קטנה מאחורה.',
    choices: [
      { label: 'לחתום', tag: 'safe', outcomes: [
        { p: 1, text: 'בית משלך. הדלת נתקעת בחורף, ואתה לא מתקן אותה כי היא כבר חלק מהמשפחה.', eff: { sanity: 12, capital: -55000, career: 4 }, flags: ['house'], milestone: 'בית', score: 70 },
      ]},
      { label: 'לשכור ולהשקיע את ההפרש', tag: 'risk', outcomes: [
        { p: .55, text: 'התיק הניב יותר מהנדל"ן. אתה גם יכול לעבור עיר בשבועיים.', eff: { capital: 70000, sanity: -4, mult: .1 }, score: 60 },
        { p: .45, text: 'שכר הדירה טיפס מהר מהתיק. כל שנה אותה שיחה עם בעל הבית.', eff: { capital: -12000, sanity: -10 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'ad_insurance', stage: [26, 40], years: 2, weight: 3,
    title: 'סוכן הביטוח',
    text: '"מאתיים ושמונים בחודש," הוא אומר. "רוב האנשים לא צריכים את זה. עד שכן."',
    choices: [
      { label: 'לחתום על הפוליסה', tag: 'safe', outcomes: [
        { p: 1, text: 'התיקייה נכנסה למגירה ונשכחה. זאת בדיוק הנקודה.', eff: { capital: -9000, sanity: 4 }, item: 'insurance', score: 30 },
      ]},
      { label: 'לוותר. הכסף עדיף בכיס', tag: 'risk', outcomes: [
        { p: 1, text: 'תשעת אלפים דולר שנשארו אצלך. בינתיים.', eff: { capital: 9000, mult: .06 }, score: 25 },
      ]},
    ],
  },

  /* ══════════════ אמצע החיים 41–58 ══════════════ */
  {
    id: 'mid_bike', stage: [41, 55], years: 3, weight: 3,
    title: 'האופנוע בחלון הראווה',
    text: 'אתה עומד מולו עשרים דקות בלי להיכנס. הוא אדום, והוא עולה בדיוק כמו שנת לימודים של הבת שלך.',
    choices: [
      { label: 'לקנות', tag: 'risk', outcomes: [
        { p: .6, text: 'כביש החוף בשש בבוקר. משהו שהיה סגור בחזה נפתח.', eff: { sanity: 16, capital: -18000, health: -3, mult: .12 }, item: 'bike', score: 55 },
        { p: .25, text: 'נפילה בכביש רטוב בחודש השני. עצם בריח וגבס.', eff: { health: -22, sanity: -6, capital: -20000 }, score: 20 },
        { p: .15, text: 'משאית בצומת לא ראתה אותך.', death: 'crash', eff: { health: -100 }, score: 30 },
      ]},
      { label: 'ללכת הביתה', tag: 'safe', outcomes: [
        { p: 1, text: 'סיפרת עליו בארוחת ערב וצחקת. חשבת עליו עוד שנתיים.', eff: { sanity: -4, capital: 18000, career: 2 }, score: 30 },
      ]},
    ],
  },
  {
    id: 'mid_affair', stage: [40, 56], years: 3, weight: 3, requires: ['married'],
    title: 'הכנס בשיקגו',
    text: 'היא מהמשרד בדנוור. אתם צוחקים בלובי בשעה שאף אחד לא צוחק בה.',
    choices: [
      { label: 'לעלות למעלית שלה', tag: 'degen', outcomes: [
        { p: .4, text: 'זה נמשך שנה. אף אחד לא גילה. אתה גילית משהו על עצמך שלא אהבת.', eff: { sanity: -14, health: 4, mult: .2 }, score: 40 },
        { p: .6, text: 'היא גילתה מהחיוב בכרטיס האשראי. גירושין, חצי מהנכסים, וכיסא ריק בחגים.', eff: { sanity: -28, capital: -140000, health: -8, mult: .15 }, flags: ['divorced'], score: 20 },
      ]},
      { label: 'להתקשר הביתה', tag: 'safe', outcomes: [
        { p: 1, text: 'דיברתם ארבעים דקות על שום דבר. זה היה בדיוק מה שהיה צריך.', eff: { sanity: 12, career: 2 }, score: 55 },
      ]},
    ],
  },
  {
    id: 'mid_parent', stage: [44, 60], years: 3, weight: 4,
    title: 'אמא מתחילה לשכוח',
    text: 'היא שאלה אותך פעמיים באותה שיחה אם אכלת.',
    choices: [
      { label: 'לקחת אותה הביתה אליך', tag: 'safe', outcomes: [
        { p: 1, text: 'ארבע שנים קשות ויפות. היא לא זכרה את השם שלך בסוף, אבל היא זכרה את היד.', eff: { sanity: 6, health: -12, capital: -30000 }, milestone: 'הבן שנשאר', score: 90 },
      ]},
      { label: 'מוסד סיעודי טוב', tag: 'risk', outcomes: [
        { p: .6, text: 'צוות מצוין, ביקור כל שבת. זאת הייתה ההחלטה הנכונה, וזה עדיין כואב.', eff: { sanity: -8, capital: -95000, health: -3 }, score: 55 },
        { p: .4, text: 'המקום היה זול מדי, ואתה יודע את זה. הביקורים הפכו לקצרים.', eff: { sanity: -20, capital: -40000 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'mid_offgrid', stage: [38, 58], years: 4, weight: 4, paths: ['rick'],
    title: 'הקרקע במונטנה',
    text: 'ארבעים דונם, בלי חשמל, בלי כתובת. המוכר מקבל רק מזומן.',
    choices: [
      { label: 'לקנות ולהיעלם', tag: 'degen', needs: { capital: 30000 }, outcomes: [
        { p: .55, text: 'בונקר, פאנלים סולאריים, ובאר. שנה אחר כך אתה לא מופיע בשום מסד נתונים בעולם.', eff: { sanity: 20, health: 8, career: -25, capital: -60000, mult: .4 }, item: 'bunker', flags: ['off_grid'], milestone: 'מחוץ לרשת', score: 150 },
        { p: .3, text: 'החורף הראשון כמעט הרג אותך. ירדת חמישה עשר קילו וחזרת לעיר לחודשיים.', eff: { health: -20, sanity: 6, capital: -60000, mult: .25 }, item: 'bunker', flags: ['off_grid'], score: 80 },
        { p: .15, text: 'שטר המכר היה מזויף. הקרקע לא הייתה שלו, והמזומן נעלם.', eff: { capital: -60000, sanity: -20, mult: .1 }, score: 30 },
      ]},
      { label: 'להישאר בעיר', tag: 'safe', outcomes: [
        { p: 1, text: 'שמרת את המספר שלו בפתקים. מעולם לא התקשרת.', eff: { sanity: -6, career: 6 }, score: 30 },
      ]},
    ],
  },
  {
    id: 'mid_health_scare', stage: [45, 62], years: 3, weight: 3,
    echo: [{ flag: 'bad_knee', note: 'הברך שמעולם לא חזרה לגמרי' },
           { flag: 'fit', note: 'הכושר שבנית' }],
    title: 'הבדיקה השנתית',
    text: 'הרופא מסתכל על המסך קצת יותר מדי זמן. "יש כמה מספרים שאני לא אוהב."',
    choices: [
      { label: 'לשנות הכל — תזונה, ריצה, בלי אלכוהול', tag: 'safe', outcomes: [
        { p: .75, pIf: { bad_knee: .55, football: 1.3, survivor: 1.25, addiction: .5 }, text: 'תוך שנה ירדת שנים במקום קילוגרמים. אתה רץ עשרה קילומטר בגיל חמישים ושתיים.', eff: { health: 20, sanity: 8, career: -3 }, flags: ['fit'], milestone: 'התאוששות', score: 80 },
        { p: .25, text: 'החזקת ארבעה חודשים. אחר כך החיים חזרו.', eff: { health: 5, sanity: -4 }, score: 30 },
      ]},
      { label: 'להתעלם. יש דברים דחופים יותר', tag: 'degen', outcomes: [
        { p: .5, text: 'המספרים תיקנו את עצמם. מזל, לא ניהול.', eff: { health: -4, mult: .1 }, score: 35 },
        { p: .5, text: 'שנתיים אחר כך זה חזר, גדול יותר.', eff: { health: -25, sanity: -10, mult: .1 }, flags: ['sick'], score: 20 },
      ]},
    ],
  },

  /* ══════════════ 58+ ══════════════ */
  {
    id: 'old_retire', stage: [58, 70], years: 4, weight: 5,
    echo: [{ flag: 'owner', note: 'העסק שבנית' }, { flag: 'loner', note: 'האנשים שלא נשארו' }],
    title: 'הפרישה',
    text: 'החשבון מספיק. השאלה היא אם אתה מספיק.',
    choices: [
      { label: 'לפרוש. לגמרי', tag: 'safe', outcomes: [
        { p: .7, pIf: { kids: 1.35, house: 1.2, old_friends: 1.2, repaired: 1.2, loner: .6, estranged: .6 }, text: 'גינה, נכדים, ובוקר שלא צריך שעון מעורר. לקח שנה להאמין שזה מותר.', eff: { sanity: 18, health: 6, career: -10 }, flags: ['retired'], milestone: 'פרישה', score: 90 },
        { p: .3, text: 'בלי העבודה לא נשאר מספיק. הימים התארכו.', eff: { sanity: -14, health: -6, career: -10 }, flags: ['retired'], score: 35 },
      ]},
      { label: 'להמשיך לעבוד', tag: 'risk', outcomes: [
        { p: .55, text: 'עוד שמונה שנים טובות. הצוות קורא לך "האגדה" וחצי מהם מתכוונים לזה.', eff: { career: 12, capital: 180000, health: -10, sanity: 4 }, score: 75 },
        { p: .45, text: 'התמוטטת בישיבה. אשפוז של שבוע ופרישה כפויה.', eff: { health: -28, sanity: -10, capital: 60000 }, flags: ['retired'], score: 35 },
      ]},
    ],
  },
  {
    id: 'old_grandkid', stage: [60, 78], years: 4, weight: 4, requires: ['kids'],
    echo: [{ flag: 'repaired', note: 'הפיוס' }, { flag: 'absent_parent', note: 'ארבע השנים שהחמצת' }],
    title: 'הנכד הראשון',
    text: 'הוא נראה בדיוק כמוך בתמונות מגיל שנתיים. זה מפחיד ומנחם באותה מידה.',
    textIf: [
      { flag: 'absent_parent', text: 'הוא נראה בדיוק כמוך בתמונות מגיל שנתיים. אתה מסתכל עליו וחושב שקיבלת הזדמנות שנייה בדיוק לאותו מבחן.' },
      { flag: 'estranged', text: 'שמעת על הלידה מאחותך. אף אחד לא התקשר אליך.' },
    ],
    choices: [
      { label: 'להיות סבא נוכח', tag: 'safe', outcomes: [
        { p: 1, text: 'לימדת אותו לרכוב, לדוג ולשקר בפוקר. הוא יזכור אותך ארבעים שנה.', eff: { sanity: 22, health: 4 }, milestone: 'סבא', score: 110 },
      ]},
      { label: 'שומר מרחק. יש לך קצב', tag: 'risk', outcomes: [
        { p: 1, text: 'ראית אותו בחגים. הוא היה נחמד. זרים נחמדים.', eff: { sanity: -10, health: 2 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'old_vegas', stage: [62, 80], years: 3, weight: 3,
    title: 'שולחן הבלאק ג׳ק',
    text: 'הבן שלך לקח אותך לוגאס ליום הולדת. יש לך צ׳יפים בשווי כל הפנסיה החודשית.',
    choices: [
      { label: 'הכל על יד אחת', tag: 'degen', outcomes: [
        { p: .45, text: 'עשרים ואחת. הדילר מחייך. יצאת מהמלון עם סיפור ששווה יותר מהכסף.', eff: { capital: 40000, sanity: 16, mult: .25 }, milestone: 'היד האחרונה', score: 90 },
        { p: .55, text: 'הפסדת בשלוש שניות. הבן שלך שילם על ארוחת הערב ולא אמר כלום.', eff: { capital: -20000, sanity: -8, mult: .12 }, score: 30 },
      ]},
      { label: 'לשחק בזהיר ולפרוש בזמן', tag: 'safe', outcomes: [
        { p: 1, text: 'יצאת בפלוס שלוש מאות דולר. שתיתם משהו והלכתם לישון.', eff: { capital: 300, sanity: 10 }, score: 45 },
      ]},
    ],
  },
  {
    id: 'old_memoir', stage: [64, 85], years: 4, weight: 3, requires: ['kids'],
    echo: [{ flag: 'off_grid', note: 'השנים שאין להן תיעוד' }, { flag: 'smuggler', note: 'המשלוחים' }],
    title: 'המחברת',
    text: 'הבת שלך הביאה מחברת ריקה. "תכתוב," היא אמרה. "אני לא יודעת שום דבר עליך לפני גיל שלושים."',
    choices: [
      { label: 'לכתוב הכל. גם את מה שלא סיפרת', tag: 'safe', outcomes: [
        { p: 1, text: 'מאה תשעים עמודים. היא קראה את זה פעמיים ובכתה בשתיהן.', eff: { sanity: 20 }, milestone: 'הסיפור נמסר', score: 100 },
      ]},
      { label: 'לכתוב רק את הגרסה הנעימה', tag: 'risk', outcomes: [
        { p: 1, text: 'זה יצא נחמד. אתה יודע איזה עמודים חסרים.', eff: { sanity: 4 }, score: 40 },
      ]},
      { label: 'להחזיר לה את המחברת', tag: 'degen', outcomes: [
        { p: 1, text: '"יש דברים שאני לוקח איתי," אמרת. היא הבינה. אולי.', eff: { sanity: -6, mult: .1 }, score: 35 },
      ]},
    ],
  },
  {
    id: 'old_last_trip', stage: [68, 92], years: 4, weight: 3,
    title: 'הכרטיס האחרון',
    text: 'הרופא אמר שנה, אולי שנתיים. יש לך מספיק לטיסה אחת לכל מקום בעולם.',
    choices: [
      { label: 'לטוס לאן שתמיד רצית', tag: 'risk', outcomes: [
        { p: .7, text: 'עמדת מול הדבר ההוא שראית בספר בגיל תשע. זה היה שווה כל שנה.', eff: { sanity: 26, health: -8, capital: -14000 }, milestone: 'המסע האחרון', score: 120 },
        { p: .3, text: 'התאשפזת בשדה התעופה. ראית את זה מהחלון של המטוס בדרך חזרה.', eff: { health: -16, sanity: 6, capital: -14000 }, score: 50 },
      ]},
      { label: 'להישאר. להיות עם המשפחה', tag: 'safe', outcomes: [
        { p: 1, text: 'כל יום שישי כולם באו. זאת הייתה השנה הכי טובה מבין העשרים האחרונות.', eff: { sanity: 22, health: 4 }, milestone: 'מוקף', score: 110 },
      ]},
    ],
  },

  /* ══════════════ אירועי מילוי (כל גיל) ══════════════ */
  {
    id: 'fill_friend', stage: [20, 70], years: 2, weight: 2,
    title: 'חבר ותיק מתקשר בשתיים בלילה',
    text: 'הוא לא מתקשר בשתיים בלילה. אף פעם.',
    choices: [
      { label: 'לקום ולנסוע אליו', tag: 'safe', outcomes: [
        { p: 1, text: 'ישבתם על המדרכה עד שהאיר. הוא עדיין פה בזכות הלילה הזה.', eff: { sanity: 12, health: -3, career: -2 }, score: 55 },
      ]},
      { label: 'לענות מחר', tag: 'risk', outcomes: [
        { p: .55, text: 'הוא היה בסדר. קצת שתה. צחקתם על זה.', eff: { sanity: -3 }, score: 20 },
        { p: .45, text: 'מחר היה מאוחר. אתה נושא את זה.', eff: { sanity: -20 }, flags: ['guilt'], score: 5 },
      ]},
    ],
  },
  {
    id: 'fill_audit', stage: [30, 65], years: 2, weight: 2,
    title: 'מכתב ממס הכנסה',
    text: 'ביקורת. שלוש שנים אחורה.',
    choices: [
      { label: 'לשכור רואה חשבון ולשתף פעולה', tag: 'safe', outcomes: [
        { p: .75, text: 'שילמת קנס קטן והכל נסגר.', eff: { capital: -6000, sanity: -4 }, score: 25 },
        { p: .25, text: 'מצאו יותר משציפית.', eff: { capital: -24000, sanity: -10 }, score: 15 },
      ]},
      { label: 'להתעלם מהמכתב', tag: 'degen', outcomes: [
        { p: .35, text: 'זה נעלם. באמת. אף אחד לא מבין למה.', eff: { sanity: -6, mult: .15 }, score: 40 },
        { p: .65, text: 'עיקול על החשבון והצמדות. זה עלה פי שלושה.', eff: { capital: -48000, sanity: -14, career: -6, mult: .08 }, score: 15 },
      ]},
    ],
  },
  {
    id: 'fill_fire', stage: [25, 70], years: 2, weight: 2,
    title: 'ריח של עשן מהדירה ממול',
    text: 'שלוש בלילה. אתה שומע גלאי, ואתה יודע שהזקן מ־4ב׳ לא שומע כלום.',
    choices: [
      { label: 'לפרוץ פנימה', tag: 'risk', outcomes: [
        { p: .65, text: 'הוצאת אותו. עשית את הדבר שרוב האנשים רק מקווים שהיו עושים.', eff: { sanity: 20, health: -10, career: 4, mult: .12 }, milestone: 'גיבור', score: 100 },
        { p: .35, text: 'הוצאת אותו, אבל הריאות שלך לא חזרו לגמרי.', eff: { health: -30, sanity: 14, mult: .12 }, flags: ['lungs'], milestone: 'גיבור', score: 85 },
      ]},
      { label: 'להזעיק כבאים ולחכות', tag: 'safe', outcomes: [
        { p: .6, text: 'הם הגיעו בזמן. הכל הסתדר.', eff: { sanity: 4 }, score: 30 },
        { p: .4, text: 'הם הגיעו באיחור של ארבע דקות.', eff: { sanity: -18 }, flags: ['guilt'], score: 10 },
      ]},
    ],
  },

  /* ══════════════ אירועי המשך — נפתחים רק בגלל בחירות קודמות ══════════════ */
  {
    id: 'cb_dog', stage: [13, 20], years: 2, weight: 6, requires: ['dog'],
    echo: { flag: 'dog', note: 'הכלב שהתחננת עליו בגיל שמונה' },
    title: 'באדי כבר לא קם מהשטיח',
    text: 'תשע שנים מאז שאבא כיבה את המנוע ליד השלט. הווטרינר מדבר בשקט ומסתכל עליך, לא על ההורים.',
    choices: [
      { label: 'להיות איתו עד הסוף', tag: 'safe', outcomes: [
        { p: 1, text: 'החזקת לו את הראש. זאת הייתה הפעם הראשונה שבכית מול אנשים, וזה לא הרג אותך.', eff: { sanity: -6, health: 2 }, flags: ['grief_ok'], score: 45 },
      ]},
      { label: 'לחכות בחוץ', tag: 'risk', outcomes: [
        { p: 1, text: 'שמעת את הדלת נסגרת ולא נכנסת. אתה עוד תחשוב על זה בגיל חמישים.', eff: { sanity: -12, career: 3 }, flags: ['guilt'], score: 15 },
      ]},
    ],
  },
  {
    id: 'cb_knee', stage: [30, 52], years: 3, weight: 5, requires: ['bad_knee'],
    echo: { flag: 'bad_knee', note: 'הברך שנקרעה בטרייאאוטים' },
    title: 'הברך חוזרת לגבות',
    text: 'האורתופד מסתכל על הצילום ואומר: "מי שתפר לך את זה בגיל שש עשרה עשה עבודה סבירה. עכשיו זה נגמר."',
    choices: [
      { label: 'ניתוח החלפה מלא', tag: 'safe', outcomes: [
        { p: .75, text: 'שישה חודשי שיקום, ואז הלכת בלי לצלוע בפעם הראשונה מזה עשרים שנה.', eff: { health: 14, capital: -34000, sanity: 8 }, score: 60 },
        { p: .25, text: 'זיהום אחרי הניתוח. שבועיים באשפוז והברך גרועה מבעבר.', eff: { health: -18, capital: -46000, sanity: -8 }, score: 15 },
      ]},
      { label: 'לחיות עם זה. משככי כאבים', tag: 'degen', outcomes: [
        { p: .4, text: 'הסתדרת. אתה קם לאט בבקרים ומקלל את המאמן ההוא בשקט.', eff: { health: -6, sanity: -4, mult: .12 }, score: 35 },
        { p: .6, text: 'המרשמים הפכו להרגל. לקח שנתיים להבין, ועוד שנה לצאת.', eff: { health: -16, sanity: -18, career: -10, mult: .1 }, item: 'meds', flags: ['addiction'], score: 20 },
      ]},
    ],
  },
  {
    id: 'cb_reunion', stage: [33, 50], years: 2, weight: 4, requires: ['football'],
    echo: { flag: 'football', note: 'העונה שבה היית כוכב הנבחרת' },
    title: 'מפגש מחזור',
    text: 'המאמן הזקן מספר לכולם על הריצה שלך בגמר. חצי מהחדר זוכר אותך בתור מישהו אחר לגמרי ממי שאתה עכשיו.',
    textIf: [
      { flag: 'owner', text: 'המאמן הזקן מספר לכולם על הריצה שלך בגמר, ואז מישהו אומר "הוא בעל החנות עכשיו" — ואתה שומע איך זה נשמע מבחוץ.' },
      { flag: 'off_grid', text: 'הם מזהים אותך בקושי. אין לך פייסבוק, אין לך כתובת, ואף אחד לא הצליח להזמין אותך — הגעת כי במקרה עברת בעיר.' },
    ],
    choices: [
      { label: 'להישאר עד הסוף ולשתות איתם', tag: 'safe', outcomes: [
        { p: 1, text: 'ארבע שעות של צחוק. שלושה מהם התקשרו אחר כך, ואחד מהם הפך שוב לחבר.', eff: { sanity: 14, career: 4 }, flags: ['old_friends'], score: 55 },
      ]},
      { label: 'ללכת אחרי חצי שעה', tag: 'risk', outcomes: [
        { p: 1, text: 'יצאת לחניון ונשמת. עדיף לזכור את גיל שבע עשרה כמו שהוא היה.', eff: { sanity: -4, career: 6, mult: .08 }, score: 30 },
      ]},
    ],
  },
  {
    id: 'cb_record', stage: [24, 44], years: 2, weight: 5, requires: ['record'],
    echo: { flag: 'record', note: 'הרישום הפלילי שנפתח לך בעבר' },
    title: 'בדיקת רקע',
    text: 'המשרה כמעט סגורה. ואז מגיע מייל מהמחלקה המשפטית: "יש כאן משהו שצריך הסבר."',
    choices: [
      { label: 'לספר הכל, בכנות', tag: 'safe', outcomes: [
        { p: .7, text: '"תודה שאמרת." קיבלת את המשרה, והמנהל סמך עליך יותר בגלל זה.', eff: { career: 14, capital: 20000, sanity: 6 }, score: 65 },
        { p: .3, text: 'הם הודו לך והמשיכו למועמד הבא.', eff: { career: -6, sanity: -10 }, score: 15 },
      ]},
      { label: 'לשלם לעורך דין למחיקת התיק', tag: 'risk', outcomes: [
        { p: .6, text: 'התיק נמחק. עשרים שנה של תווית ירדו בבת אחת.', eff: { capital: -22000, sanity: 12, career: 8 }, flags: ['clean_record'], score: 60 },
        { p: .4, text: 'עורך הדין לקח את הכסף והתיק נשאר בדיוק במקום.', eff: { capital: -22000, sanity: -10 }, score: 10 },
      ]},
    ],
  },
  {
    id: 'cb_shop', stage: [46, 68], years: 3, weight: 5, requires: ['owner'],
    echo: { flag: 'owner', note: 'החנות שקנית מהבעלים הקודם' },
    title: 'מישהו רוצה לקנות את החנות',
    text: 'רשת גדולה שמה על השולחן פי שלושה ממה ששילמת. השלט עם השם שלך ירד למחרת.',
    choices: [
      { label: 'למכור', tag: 'safe', outcomes: [
        { p: 1, text: 'חתמת, ואז ישבת ברכב בחניון עשרים דקות. הכסף אמיתי, וגם החור.', eff: { capital: 420000, sanity: -8, career: -12 }, flags: ['sold_shop'], milestone: 'האקזיט', score: 95 },
      ]},
      { label: 'לסרב ולהעביר לילדים', tag: 'risk', needs: { flag: 'kids' }, outcomes: [
        { p: .55, text: 'הבת שלך ניהלה את זה טוב ממך. שלוש שנים אחר כך יש שתי סניפים.', eff: { capital: 90000, sanity: 22, career: 6 }, milestone: 'עסק משפחתי', score: 130 },
        { p: .45, text: 'היא לא רצתה את זה מעולם, ולקח לכם שנתיים לומר את זה בקול.', eff: { capital: -30000, sanity: -16 }, score: 30 },
      ]},
      { label: 'לסרב. זאת החנות שלי', tag: 'degen', outcomes: [
        { p: .5, text: 'הרשת פתחה מולך וסגרה אחרי שנתיים. ניצחת, וזה עלה לך בשיער.', eff: { capital: -40000, sanity: 16, health: -8, mult: .2 }, milestone: 'לא נמכר', score: 100 },
        { p: .5, text: 'הרשת פתחה מולך ואתה סגרת אחרי שלוש שנים. בלי כסף ובלי שלט.', eff: { capital: -120000, sanity: -20, career: -18, mult: .12 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'cb_survivor', stage: [42, 72], years: 3, weight: 5, requires: ['survivor'],
    echo: { flag: 'survivor', note: 'האבחנה ששרדת בגיל שלושים' },
    title: 'הסריקה השנתית',
    text: 'עשר שנים של אותו חדר המתנה, אותו ריח. אתה יודע לזהות לפי הפנים של האחות אם זה בסדר.',
    choices: [
      { label: 'להמשיך לעקוב, כל שנה, בלי לפספס', tag: 'safe', outcomes: [
        { p: .85, text: 'נקי. וכל שנה שעוברת אתה חי אותה קצת פחות בפחד.', eff: { health: 8, sanity: 10, capital: -6000 }, score: 70 },
        { p: .15, text: 'תפסו משהו קטן מוקדם. הוציאו, וזה נגמר שם.', eff: { health: -8, sanity: -6, capital: -30000 }, score: 55 },
      ]},
      { label: 'להפסיק לבוא. נמאס להיות חולה', tag: 'degen', outcomes: [
        { p: .45, text: 'חיית שנים בלי לחשוב על זה בכלל. זה היה שווה משהו.', eff: { sanity: 16, mult: .2 }, score: 60 },
        { p: .55, text: 'כשזה חזר, זה כבר לא היה שלב שניתן לתפוס מוקדם.', eff: { health: -35, sanity: -14, mult: .15 }, flags: ['sick'], score: 25 },
      ]},
    ],
  },
  {
    id: 'cb_absent', stage: [48, 70], years: 3, weight: 5, requires: ['absent_parent'],
    echo: { flag: 'absent_parent', note: 'ארבע השנים שבהן היית בדרכים' },
    title: 'היא אומרת את זה סוף סוף',
    text: '"לא היית שם." לא בצעקות. בשקט, בין שתי מנות, אחרי עשרים שנה שהיא לא אמרה את זה.',
    choices: [
      { label: 'להקשיב עד הסוף בלי להתגונן', tag: 'safe', outcomes: [
        { p: .8, text: 'שתקת ארבעים דקות ואמרת "את צודקת". זה לא תיקן הכל, אבל זה פתח משהו.', eff: { sanity: 20 }, flags: ['repaired'], milestone: 'הפיוס', score: 110 },
        { p: .2, text: 'היא הייתה צריכה לומר את זה, לא לשמוע תשובה. אתם עדיין מדברים פעם בחודש.', eff: { sanity: -6 }, score: 35 },
      ]},
      { label: '"עבדתי בשבילכם"', tag: 'risk', outcomes: [
        { p: 1, text: 'המשפט הזה סגר את הדלת. היא שילמה על הארוחה ולא ענתה לטלפון חודשיים.', eff: { sanity: -22, career: 4 }, flags: ['estranged'], score: 15 },
      ]},
    ],
  },
  {
    id: 'cb_offgrid_price', stage: [45, 75], years: 3, weight: 5, requires: ['off_grid'],
    echo: { flag: 'off_grid', note: 'היום שבו יצאת מהרשת' },
    title: 'אין לך תיק רפואי',
    text: 'כאב בחזה בשלוש לפנות בוקר. בית החולים הקרוב במרחק שעה, ובמערכת שלהם אתה לא קיים.',
    choices: [
      { label: 'לנסוע ולהמציא שם', tag: 'risk', outcomes: [
        { p: .6, text: 'טיפלו בך. שילמת מזומן ויצאת לפני שמישהו שאל יותר מדי.', eff: { health: -8, capital: -18000, sanity: -6, mult: .12 }, score: 55 },
        { p: .4, text: 'בלי היסטוריה רפואית הם ניחשו. ניחוש אחד היה שגוי.', eff: { health: -26, capital: -22000, sanity: -10, mult: .1 }, score: 25 },
      ]},
      { label: 'לחכות עד הבוקר בבונקר', tag: 'degen', needs: { item: 'bunker' }, outcomes: [
        { p: .5, text: 'עבר. אולי זה היה שריר. אתה לא תדע לעולם.', eff: { health: -10, sanity: 6, mult: .25 }, score: 70 },
        { p: .5, text: 'זה היה התקף. שרדת אותו לבד, ומאז הלב לא אותו הלב.', eff: { health: -32, sanity: -8, mult: .2 }, flags: ['heart'], score: 45 },
      ]},
    ],
  },
  {
    id: 'cb_guilt', stage: [40, 72], years: 3, weight: 4, requires: ['guilt'],
    echo: { flag: 'guilt', note: 'הלילה שלא ענית' },
    title: 'המכתב במגירה',
    text: 'מצאת אותו במקרה, בקופסה של אמא. הוא כתב לך שבוע לפני, ואתה מעולם לא פתחת.',
    choices: [
      { label: 'לקרוא', tag: 'risk', outcomes: [
        { p: .65, text: 'הוא לא האשים אותך בכלום. זה היה גרוע יותר, ואז הרבה יותר טוב.', eff: { sanity: 18 }, flags: ['closure'], milestone: 'סגירת מעגל', score: 90 },
        { p: .35, text: 'הוא כן האשים. וצדק. שרפת את זה בגינה ולא סיפרת לאף אחד.', eff: { sanity: -14, mult: .1 }, score: 30 },
      ]},
      { label: 'להחזיר לקופסה', tag: 'safe', outcomes: [
        { p: 1, text: 'יש דברים שאתה לא צריך לדעת. אתה חוזר לחשוב על הקופסה כל שנה בערך.', eff: { sanity: -6 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'cb_whale', stage: [35, 65], years: 3, weight: 5, requires: ['whale'],
    echo: { flag: 'whale', note: 'הטרייד שעשה אותך עשיר' },
    title: 'כולם יודעים',
    text: 'בן דוד שלא דיברת איתו עשור מתקשר. אחר כך עוד אחד. לכולם יש רעיון, ולכולם יש מספר.',
    choices: [
      { label: 'לתת לכולם. זה רק כסף', tag: 'safe', outcomes: [
        { p: .5, text: 'שני עסקים הצליחו, ארבעה לא, ומשפחה שלמה חייבת לך את הבית. אתה ישן טוב.', eff: { capital: -260000, sanity: 18 }, flags: ['patron'], milestone: 'הנדבן', score: 100 },
        { p: .5, text: 'הכסף נגמר והטלפונים לא. עכשיו אתה גם קמצן בעיניהם.', eff: { capital: -340000, sanity: -16 }, score: 30 },
      ]},
      { label: 'לסגור את הברז ולנתק', tag: 'degen', outcomes: [
        { p: 1, text: 'שמרת על ההון. בחגים יושבים סביב השולחן שמונה אנשים במקום עשרים ושניים.', eff: { sanity: -14, capital: 40000, mult: .2 }, flags: ['loner'], score: 55 },
      ]},
      { label: 'קרן משפחתית עם כללים ברורים', tag: 'risk', outcomes: [
        { p: .7, text: 'ועדה, טפסים, ריבית אפס. זה הציל גם את הכסף וגם את החתונות.', eff: { capital: -120000, sanity: 14, career: 8 }, milestone: 'הקרן', score: 95 },
        { p: .3, text: 'הכללים החזיקו שנתיים, ואז הפכו למלחמה עם עורכי דין.', eff: { capital: -180000, sanity: -18 }, score: 25 },
      ]},
    ],
  },
  {
    id: 'cb_broke', stage: [30, 66], years: 3, weight: 5, requires: ['broke'],
    echo: { flag: 'broke', note: 'ההימור שמחק לך הכל' },
    title: 'הצעה לחזור לשולחן',
    text: 'אותו חבר, אותו לינק, אותה זווית בגרף. הפעם הוא אומר "אני יודע שנשרפת, אבל".',
    choices: [
      { label: 'לחסום את המספר', tag: 'safe', outcomes: [
        { p: 1, text: 'לקח לך שבע שנים ללמוד את המשפט הזה. עכשיו הוא עולה לך שנייה.', eff: { sanity: 12, capital: 10000, career: 4 }, flags: ['disciplined'], milestone: 'למדתי', score: 75 },
      ]},
      { label: 'סכום קטן. רק כדי להחזיר', tag: 'degen', outcomes: [
        { p: .35, text: 'החזרת את מה שאיבדת ועצרת בדיוק שם. כמעט אף אחד לא עוצר בדיוק שם.', eff: { capital: 90000, sanity: 8, mult: .3 }, milestone: 'ההחזר', score: 110 },
        { p: .65, text: 'הסכום הקטן גדל תוך חודש. הפעם זה לקח גם את הבית.', eff: { capital: -140000, sanity: -24, health: -8, mult: .2 }, score: 20 },
      ]},
    ],
  },
  {
    id: 'cb_divorce_after', stage: [48, 74], years: 3, weight: 4, requires: ['divorced'],
    echo: { flag: 'divorced', note: 'הגירושין' },
    title: 'היא מתחתנת שוב',
    text: 'ההזמנה הגיעה בדואר, עם הכתב שלה. הבת שלכם ביקשה שתבוא.',
    choices: [
      { label: 'ללכת, ולהיות בסדר', tag: 'safe', outcomes: [
        { p: .7, text: 'לחצת יד לחתן ורקדת עם הבת שלך. יצאת מוקדם ובכל זאת ניצחת משהו.', eff: { sanity: 16 }, flags: ['repaired'], score: 80 },
        { p: .3, text: 'הגעת, וזה היה קשה מכפי שחשבת. הבת שלך ראתה, וזה מה שהיא זוכרת.', eff: { sanity: -10 }, score: 30 },
      ]},
      { label: 'לא להגיע', tag: 'risk', outcomes: [
        { p: 1, text: 'שלחת מתנה בלי פתק. הבת שלך לא אמרה כלום, ואת זה בדיוק שמעת.', eff: { sanity: -14, capital: -4000 }, score: 20 },
      ]},
    ],
  },

  /* ══════════════ משברים כפויים ══════════════ */
  {
    id: 'crisis_cancer', crisis: true, stage: [29, 33], years: 3, weight: 0, forced: 'cancer',
    echo: [{ item: 'insurance', note: 'הפוליסה שחתמת עליה' }, { flag: 'married', note: 'מי שמחכה לך בבית' }],
    title: 'האבחנה',
    textIf: [
      { flag: 'kids', text: 'שלב שני. הרופא מדבר על אחוזים, ואתה לא שומע אף אחד מהם. אתה חושב רק על מי שמחכה לך בבית.' },
      { flag: 'off_grid', text: 'שלב שני. גילית את זה מאוחר כי אין לך רופא משפחה, אין לך תיק, ואין לך מי שיזכיר לך ללכת.' },
    ],
    text: 'שלב שני. הרופא מדבר על אחוזים, ואתה לא שומע אף אחד מהם. גיל שלושים.',
    choices: [
      { label: 'טיפול מלא. להילחם בכל מה שיש', tag: 'safe', outcomes: [
        { p: .84, pIf: { fit: 1.15, married: 1.1, dog: 1.05, addiction: .75, loner: .9 }, text: 'ארבעה עשר חודשים של גיהינום. הרמיסיה הגיעה בסתיו. אתה חוזר אחר.', eff: { health: -18, sanity: -10, capital: -120000, career: -8, mult: .2 }, flags: ['survivor'], milestone: 'ניצול', score: 160 },
        { p: .16, text: 'הגוף לא הגיב. שלושה חודשים אחרי הסבב האחרון זה נגמר.', death: 'cancer', eff: { health: -100 }, score: 90 },
      ]},
      { label: 'להפעיל את הפוליסה', tag: 'safe', needs: { item: 'insurance' }, consumes: 'insurance', outcomes: [
        { p: .94, text: 'הביטוח כיסה את המרכז הרפואי הטוב במדינה. רמיסיה מלאה תוך שנה.', eff: { health: -10, sanity: -4, capital: -12000, mult: .2 }, flags: ['survivor'], milestone: 'ניצול', score: 180 },
        { p: .06, text: 'גם הכסף הטוב ביותר לא עוצר את זה תמיד.', death: 'cancer', eff: { health: -100 }, score: 100 },
      ]},
      { label: 'לוותר על טיפול. לחיות את מה שנשאר', tag: 'degen', outcomes: [
        { p: .3, text: 'זה נסוג לבד. הרופאים כתבו על זה מאמר. אתה חי עוד ארבעים שנה עם סוד.', eff: { health: -20, sanity: 20, mult: .6 }, flags: ['survivor', 'miracle'], milestone: 'הנס', score: 260 },
        { p: .7, text: 'תשעה חודשים. טובים יותר משציפית, קצרים בהרבה ממה שמגיע.', death: 'cancer', eff: { health: -100 }, score: 120 },
      ]},
    ],
  },
  {
    id: 'crisis_crash', crisis: true, stage: [40, 44], years: 3, weight: 0, forced: 'crash',
    echo: [{ flag: 'whale', note: 'הטרייד הגדול שלך' }, { flag: 'broke', note: 'הפעם הקודמת שנשרפת' }],
    title: 'השוק קורס',
    text: 'ארבעים ושתיים אחוז בשבועיים. הטלפון של הבנק לא מפסיק לצלצל, ואף אחד שם לא עונה.',
    choices: [
      { label: 'למכור הכל עכשיו', tag: 'safe', outcomes: [
        { p: 1, text: 'עצרת את הדימום. פספסת גם את ההתאוששות, אבל ישנת בלילה.', eff: { capital: -35000, sanity: -6 }, score: 40 },
      ]},
      { label: 'לא לגעת. לחכות', tag: 'risk', outcomes: [
        { p: .6, pIf: { disciplined: 1.6, whale: 1.3, broke: .7 }, text: 'שלוש שנים אחר כך התיק היה גבוה מאי פעם. הידיים היו יציבות.', eff: { capital: 120000, sanity: -14, mult: .15 }, milestone: 'ידיים יציבות', score: 90 },
        { p: .4, text: 'ההתאוששות הגיעה מאוחר מדי בשבילך. מכרת בתחתית השנייה.', eff: { capital: -90000, sanity: -20, health: -6 }, score: 20 },
      ]},
      { label: 'למנף פנימה בתחתית', tag: 'degen', outcomes: [
        { p: .35, pIf: { whale: 1.5, broke: .6, disciplined: .8 }, text: 'קנית את הקרקעית בדיוק. פי ארבעה בשלוש שנים.', eff: { capital: 400000, sanity: -10, mult: .4 }, flags: ['whale'], milestone: 'הקרקעית', score: 200 },
        { p: .65, text: 'זאת לא הייתה הקרקעית. מרג׳ין קול חיסל את כל מה שבנית בעשרים שנה.', eff: { capital: -260000, sanity: -30, health: -10, mult: .2 }, flags: ['broke'], score: 40 },
      ]},
    ],
  },
  {
    id: 'crisis_hunted', crisis: true, stage: [30, 70], years: 2, weight: 0, forced: 'hunted', requires: ['hunted'],
    title: 'הם מצאו את הכתובת',
    text: 'הרכב חונה מול הבית שלושה לילות ברצף. הלילה הוא כבוי.',
    choices: [
      { label: 'להיכנס לבונקר', tag: 'safe', needs: { item: 'bunker' }, outcomes: [
        { p: .9, text: 'שבועיים מתחת לאדמה. כשיצאת, הם כבר ויתרו.', eff: { sanity: -10, health: -5, mult: .15 }, score: 70 },
        { p: .1, text: 'הם ידעו על הבונקר.', death: 'hunted', eff: { health: -100 }, score: 40 },
      ]},
      { label: 'לצאת מהדלת האחורית עם הזהות הבדויה', tag: 'risk', needs: { item: 'burner_id' }, consumes: 'burner_id', outcomes: [
        { p: .75, text: 'שם חדש, מדינה חדשה. השארת מאחור הכל חוץ מהתיק.', eff: { capital: -30000, sanity: -12, career: -10, mult: .2 }, score: 85 },
        { p: .25, text: 'הזהות לא החזיקה בביקורת הגבולות.', death: 'hunted', eff: { health: -100 }, score: 45 },
      ]},
      { label: 'לחכות להם עם הרובה', tag: 'degen', outcomes: [
        { p: .35, text: 'הם לא ציפו שמישהו יהיה ער. הם לא חזרו.', eff: { sanity: -18, health: -14, mult: .35 }, score: 120 },
        { p: .65, text: 'הם היו ארבעה.', death: 'hunted', eff: { health: -100 }, score: 60 },
      ]},
    ],
  },
  {
    id: 'crisis_broke', crisis: true, stage: [25, 70], years: 2, weight: 0, forced: 'debt',
    title: 'החשבון בחריגה',
    text: 'הכרטיס נדחה בסופר, מול אנשים. יש לך שבועיים לפני שהעיקול נכנס.',
    choices: [
      { label: 'למכור הכל ולהתחיל מחדש', tag: 'safe', outcomes: [
        { p: 1, text: 'דירת שני חדרים ועבודה שאתה לא אוהב. אבל אתה במאזן חיובי.', eff: { capital: 25000, sanity: -14, career: -8 }, score: 30 },
      ]},
      { label: 'הלוואה חוץ־בנקאית', tag: 'degen', outcomes: [
        { p: .4, text: 'החזרת בזמן. בקושי. הריבית לימדה אותך משהו קבוע.', eff: { capital: 15000, sanity: -12, mult: .2 }, score: 45 },
        { p: .6, text: 'לא החזרת בזמן. עכשיו יש לך נושים עם שיטות משלהם.', eff: { capital: -20000, health: -18, sanity: -16, mult: .15 }, flags: ['hunted'], score: 20 },
      ]},
    ],
  },
];

/** Endings — keyed by the `death` value on an outcome, plus systemic ends. */
export const ENDINGS = {
  cancer:   { title: 'המחלה ניצחה', text: 'הריצה נעצרה בגיל {age}. הגוף החזיק כמה שיכול.' },
  crash:    { title: 'תאונה', text: 'רגע אחד בכביש סיים חיים שלמים בגיל {age}.' },
  cartel:   { title: 'החוב נגבה', text: 'אנשים שאין להם סבלנות מצאו אותך בגיל {age}.' },
  hunted:   { title: 'הם הגיעו ראשונים', text: 'לחיות מחוץ לרשת אומר גם למות בלי עדים. גיל {age}.' },
  health:   { title: 'הגוף כבה', text: 'הבריאות התרוקנה. הלב עצר בגיל {age}.' },
  sanity:   { title: 'ההתעוררות', text: 'משהו נשבר בגיל {age}. אתה קם מהכיסא בארקייד ומסתכל על הידיים שלך. הן לא של רוי.' },
  oldage:   { title: 'זקנה', text: 'נגמר בשינה, בגיל {age}. זה נחשב ניצחון.' },
  retire:   { title: 'חיים שנחיו היטב', text: 'הריצה הסתיימה מרצון בגיל {age}, עם כל מה שנשאר במקום.' },
};

export const MAX_AGE = 94;
