import type { Context } from "hono";
import type { ContextVariables } from "../constants";

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 100; // Max requests per window per client
const WINDOW_SIZE_MS = 15 * 60 * 1000; // 15 minute

export const rateLimitMiddleware = async (
  c: Context<ContextVariables>,
  next: Function,
) => {
  const userID = c.get("userId");
  if (!userID) {
    await next();
    return;
  }
  const now = Date.now();
  let requestsData = requestCounts.get(userID);
  if (!requestsData) {
    requestsData = { count: 1, resetTime: now + WINDOW_SIZE_MS };
    requestCounts.set(userID, requestsData);
  } else {
    if (now > requestsData.resetTime) {
      requestsData.count = 1;
      requestsData.resetTime = now + WINDOW_SIZE_MS;
    } else {
      requestsData.count++;
    }
  }
  if (requestsData.count > MAX_REQUESTS) {
    return c.text("Rate limit exceeded. Try again later.", 429);
  } else {
    requestCounts.set(userID, requestsData);
    await next();
  }
};
