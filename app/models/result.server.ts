import { prisma } from "~/db.server";

export function createResult(result: {
  userId: number;
  textId: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  corrections: number;
  durationMs: number;
}) {
  return prisma.result.create({ data: result, select: { id: true } });
}

// The user's most recent results, newest first, with the text's title.
export function getRecentResults(userId: number, take = 50) {
  return prisma.result.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      wpm: true,
      accuracy: true,
      mistakes: true,
      corrections: true,
      durationMs: true,
      createdAt: true,
      text: { select: { id: true, title: true } },
    },
  });
}

// Totals over all of the user's results, calculated by the database.
export async function getResultStats(userId: number) {
  const stats = await prisma.result.aggregate({
    where: { userId },
    _count: true,
    _avg: { wpm: true, accuracy: true },
    _max: { wpm: true },
  });

  return {
    practiceCount: stats._count,
    averageWpm: stats._avg.wpm,
    bestWpm: stats._max.wpm,
    averageAccuracy: stats._avg.accuracy,
  };
}
