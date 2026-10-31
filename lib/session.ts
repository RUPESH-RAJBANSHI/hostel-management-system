import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "../src/generated/prisma/client";

const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error("SESSION_SECRET is not set in .env");
const key = new TextEncoder().encode(secret);

const COOKIE_NAME = "hostel_session";
const SESSION_DAYS = 7;

export type SessionPayload = { userId: string; role: Role };

async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function decrypt(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encrypt(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession() {
  const store = await cookies();
  return decrypt(store.get(COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
