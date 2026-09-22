import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type EncryptedProviderToken = {
  encryptedToken: string;
  tokenIv: string;
  tokenTag: string;
};

function providerTokenKey(): Buffer {
  const encoded = process.env.MARKETPLACE_PROVIDER_TOKEN_KEY;
  if (!encoded) throw new Error("MARKETPLACE_PROVIDER_TOKEN_KEY is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("MARKETPLACE_PROVIDER_TOKEN_KEY must decode to exactly 32 bytes");
  return key;
}

export function encryptProviderToken(token: string): EncryptedProviderToken {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", providerTokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    encryptedToken: encrypted.toString("base64"),
    tokenIv: iv.toString("base64"),
    tokenTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptProviderToken(value: EncryptedProviderToken): string {
  const decipher = createDecipheriv("aes-256-gcm", providerTokenKey(), Buffer.from(value.tokenIv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tokenTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.encryptedToken, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
