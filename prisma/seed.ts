// Seed script: fills a fresh database with the built-in practice texts.
// Run with: npm run db:seed   (Prisma also runs it after `prisma migrate reset`)
// Safe to run repeatedly: a text is only inserted if no text with that title exists yet.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Built-in texts have no owner (ownerId stays null), so they survive user deletion.
const builtInTexts = [
  {
    title: "The lighthouse keeper",
    language: "en",
    content:
      "The lighthouse keeper climbed the spiral stairs every evening just before dusk. He checked the lamp, polished the glass, and wound the clockwork that turned the great lens through the night. Ships far out at sea could not see him, but they trusted the light, and that was enough. In winter the wind shook the tower and the waves threw salt against the windows, yet the beam swept on, steady and patient, until the first grey light of morning.",
  },
  {
    title: "The last train",
    language: "en",
    content:
      "The last train left the station at eleven minutes past midnight, and Mara was the only passenger. The carriage lights flickered as the city thinned into fields, and somewhere behind her a door slid open and closed again. She did not turn around. Instead she watched her own reflection in the dark window, and behind it, faint but unmistakable, a second face that was not hers. When the train stopped at the next town, the platform was empty, and the door beside her opened on its own.",
  },
  {
    title: "A recipe for bread",
    language: "en",
    content:
      "Good bread needs only four things: flour, water, salt and time. Mix the flour and water until no dry patches remain, then let the dough rest for half an hour so the flour can drink. Add the salt, fold the dough over itself a few times, and leave it covered in a warm corner of the kitchen. When it has doubled, shape it gently, let it rise once more, and bake it hot until the crust sings when you tap it.",
  },
  {
    title: "Notes from a small observatory",
    language: "en",
    content:
      "On clear nights the dome opens with a slow groan and the telescope swings toward whatever the sky offers. Jupiter first, because it is easy and because the moons line up like beads on a string. Then the faint things: a smudge of a galaxy, a cluster that resolves into a thousand points of light. By two in the morning the notebook is full of numbers, the coffee is cold, and the astronomer is quietly, completely happy.",
  },
  {
    title: "השען מרחוב הדקלים",
    language: "he",
    content:
      "השען הזקן מרחוב הדקלים לא מכר שעונים, הוא רק תיקן אותם. אנשים הביאו לו שעוני כיס שנעצרו לפני שנים, שעוני קיר שצלצלו בשעה הלא נכונה, ושעון חול אחד שהחול בו נתקע באמצע. הוא הקשיב לכל שעון כמו רופא, ואחר כך פתח אותו בזהירות ושתק. בלילה האחרון של השנה הוא סגר את החנות, הניח את כל השעונים על השולחן, וכיוון את כולם לאותה דקה בדיוק. בחצות כולם צלצלו יחד, ובפעם הראשונה מזה שנים הוא חייך.",
  },
  {
    title: "הגן על הגג",
    language: "he",
    content:
      "על גג הבניין הישן, בין דודי השמש והאנטנות, גדל גן קטן. איש לא זכר מי שתל את העציץ הראשון, אבל עם השנים הצטרפו אליו עגבניות, נענע, שיח רוזמרין וגפן אחת עקשנית שטיפסה על המעקה. בערבי הקיץ היו הדיירים עולים לשם עם כיסאות פלסטיק, שותים תה ומסתכלים על העיר שמתחת. הגן לא היה גדול, אבל הוא היה שלהם.",
  },
];

for (const text of builtInTexts) {
  const existing = await db.text.findFirst({ where: { title: text.title } });
  if (existing) {
    console.log(`skip   ${text.title} (already exists)`);
    continue;
  }
  await db.text.create({ data: { ...text, ownerId: null, source: "BUILTIN" } });
  console.log(
    `insert ${text.title} (${Array.from(text.content).length} characters)`,
  );
}

await db.$disconnect();
