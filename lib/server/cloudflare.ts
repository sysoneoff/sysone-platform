import { getCloudflareContext } from "@opennextjs/cloudflare";

export type SysOneEnv = CloudflareEnv;

export function getSysOneEnv(): SysOneEnv {
  return getCloudflareContext().env as SysOneEnv;
}

export function requireBinding<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new Error(`Missing Cloudflare binding: ${name}`);
  }
  return value;
}
