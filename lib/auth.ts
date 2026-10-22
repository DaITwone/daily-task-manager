
import "server-only";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "dtm_session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error("SESSION_SECRET phải là chuỗi hex 64 ký tự.");
  }

  return new TextEncoder().encode(secret);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: "daily-task-manager",
      audience: "daily-task-manager-web",
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.employeeId !== "string" ||
      typeof payload.jobTitle !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      employeeId: payload.employeeId,
      jobTitle: payload.jobTitle,
    };
  } catch {
    return null;
  }
}
