import { prisma } from "~/db.server";

// Built-in texts (ownerId = null) that every user can practise on.
const builtInTexts = [
  {
    title: "A quiet morning",
    content:
      "A quiet morning is a good time to practice a new skill. Sit comfortably, relax your hands.",
  },
  {
    title: "Small steps",
    content:
      "Speed comes from accuracy. Type slowly at first, keep your eyes on the screen, and let your fingers learn the way.",
  },
  {
    title: "The library",
    content:
      "The old library smelled of paper and dust. Every shelf held a story, and every story was waiting for a reader.",
  },
];

async function main() {
  const existingCount = await prisma.text.count({ where: { ownerId: null } });

  if (existingCount > 0) {
    console.log("Built-in texts already exist, nothing to seed.");
    return;
  }

  await prisma.text.createMany({ data: builtInTexts });
  console.log(`Seeded ${builtInTexts.length} built-in texts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
