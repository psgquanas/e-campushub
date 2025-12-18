import { Redis } from "@upstash/redis";
import { env } from "./env";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_URL and UPSTASH_REDIS_REST_TOKEN must be defined"
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}
