import { getCookie, setCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { AppEnv } from "./env";

const COOKIE = "eid";

export async function ensureUser(c: Context<AppEnv>, next: Next) {
  let userId = getCookie(c, COOKIE);
  if (!userId) {
    userId = crypto.randomUUID();
    setCookie(c, COOKIE, userId, {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  await c.env.DB.prepare(
    `INSERT INTO users (id) VALUES (?)
     ON CONFLICT(id) DO NOTHING`,
  )
    .bind(userId)
    .run();

  c.set("userId", userId);
  await next();
}
