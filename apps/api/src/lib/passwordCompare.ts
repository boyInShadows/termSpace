import { compare } from "bcryptjs";

// Cost-12 hash of a random string nobody knows. Comparing against it when the
// account is missing (or has no password) makes "no such user" cost the same as
// "wrong password", so response time does not reveal which emails exist.
const MISSING_ACCOUNT_HASH = "$2b$12$C/As8JlmgjqXzORuhvydWOZEI7ffsIPi8I3aCcenLIDd7YW8QOqG6";

export async function comparePassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const matches = await compare(password, hash || MISSING_ACCOUNT_HASH);
  return Boolean(hash) && matches;
}
