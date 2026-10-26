import bcrypt from "bcryptjs";
import { prisma } from "~/db.server";

// Higher = slower to hash = slower to brute-force. 12 takes about 0.25 s.
const BCRYPT_COST = 12;

export function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
}

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  return prisma.user.create({
    data: { email, passwordHash },
    select: { id: true },
  });
}

// Returns the user's id if the email and password match, otherwise null.
export async function verifyLogin(
  email: string,
  password: string,
): Promise<number | null> {
  const user = await getUserByEmail(email);

  // Google-only users have no password, so they can't log in this way.
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user.id : null;
}

// Finds the user for a Google account, linking or creating one if needed.
export async function findOrCreateGoogleUser(googleId: string, email: string) {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId } });

  if (byGoogleId) {
    return byGoogleId.id;
  }

  // Same email registered with a password: link the Google account to it.
  // Safe because Google has verified that this person owns the email.
  const byEmail = await getUserByEmail(email);

  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId },
    });
    return byEmail.id;
  }

  const created = await prisma.user.create({ data: { email, googleId } });
  return created.id;
}
