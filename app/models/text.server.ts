import { prisma } from "~/db.server";
import type { Language } from "~/generated/prisma/client";

const textFields = {
  id: true,
  title: true,
  content: true,
  language: true,
  ownerId: true,
} as const;

// A user may use the built-in texts (ownerId null) and their own texts.
// Logged-out visitors (userId null) only get the built-in ones.
function visibleTo(userId: number | null) {
  return userId === null
    ? { ownerId: null }
    : { OR: [{ ownerId: null }, { ownerId: userId }] };
}

export function getTextsForUser(userId: number | null) {
  return prisma.text.findMany({
    where: visibleTo(userId),
    orderBy: [{ ownerId: { sort: "asc", nulls: "first" } }, { id: "asc" }],
    select: textFields,
  });
}

// Returns null both when the text doesn't exist and when it belongs to
// someone else, so other users' texts can't even be detected.
export function getTextForUser(id: number, userId: number | null) {
  return prisma.text.findFirst({
    where: { id, ...visibleTo(userId) },
    select: textFields,
  });
}

export function getFirstBuiltInText() {
  return prisma.text.findFirst({
    where: { ownerId: null },
    orderBy: { id: "asc" },
    select: textFields,
  });
}

export function createText(
  ownerId: number,
  text: { title: string; content: string; language: Language },
) {
  return prisma.text.create({
    data: { ...text, ownerId },
    select: { id: true },
  });
}
