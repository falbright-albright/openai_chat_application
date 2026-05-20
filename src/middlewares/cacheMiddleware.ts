import { Context } from "hono";
import type { ContextVariables } from "../constants";
interface CacheEntry {
  body: any;
  expiration: number;
}

export const cacheMiddleware = () => {
  const cache = new Map<string, CacheEntry>();

  return async (c: Context<ContextVariables>, next: () => Promise<void>) => {
    const userId = c.get("userId");
    const path = c.req.path;
    const cacheKey = `${userId}:${path}`;

    c.set("cache", {
      cache: (body: any, expiration: number = 3600) => {
        const expireAt = Date.now() + expiration * 1000;
        const entry = { body, expiration: expireAt };
        cache.set(cacheKey, entry);
      },
      clear: () => {
        cache.delete(cacheKey);
      },
      clearPath: (targetPath: string) => {
        const fullKey = `${targetPath}:${userId}`;
        cache.delete(fullKey);
      },
    });

    if (c.req.method.toUpperCase() === "GET") {
      const cacheEntry = cache.get(cacheKey);
      if (cacheEntry) {
        if (cacheEntry.expiration > Date.now()) {
          return c.json(cacheEntry.body);
        }
      }
    }
    await next();
  };
};
