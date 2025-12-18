import { getRedis } from "./redis";

interface OTPData {
  otp: string;
  email: string;
  userId: string;
  createdAt: number;
}

const OTP_EXPIRY = 600; // 10 minutes in seconds

export class OTPStore {
  private redis = getRedis();

  private getKey(userId: string, email: string): string {
    return `otp:${userId}:${email}`;
  }

  async set(userId: string, email: string, otp: string): Promise<void> {
    const key = this.getKey(userId, email);
    const data: OTPData = {
      otp,
      email,
      userId,
      createdAt: Date.now(),
    };

    await this.redis.setex(key, OTP_EXPIRY, JSON.stringify(data));
  }

  async get(userId: string, email: string): Promise<OTPData | null> {
    const key = this.getKey(userId, email);
    const data = await this.redis.get(key);

    if (!data) return null;

    return (typeof data === "string" ? JSON.parse(data) : data) as OTPData;
  }

  async verify(userId: string, email: string, otp: string): Promise<boolean> {
    const stored = await this.get(userId, email);
    return stored ? stored.otp === otp : false;
  }

  async delete(userId: string, email: string): Promise<void> {
    const key = this.getKey(userId, email);
    await this.redis.del(key);
  }

  async getTTL(userId: string, email: string): Promise<number> {
    const key = this.getKey(userId, email);
    return await this.redis.ttl(key);
  }
}

export const otpStore = new OTPStore();
