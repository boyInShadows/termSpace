export type EmailDeliveryResult =
  | { outcome: "sent"; statusCode: number }
  | { outcome: "retry" | "failed"; statusCode?: number; errorCode: string };

type SendVerificationEmailInput = {
  to: string;
  verificationUrl: string;
  correlationId: string;
};

type FetchLike = typeof fetch;
type CloudflareEmailResponse = { result?: { delivered?: unknown[]; queued?: unknown[]; permanent_bounces?: unknown[] } };

function emailConfig() {
  const values = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_EMAIL_API_TOKEN,
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
    fromName: process.env.EMAIL_FROM_NAME ?? "TermSpace",
  };
  if (!values.accountId || !values.apiToken || !values.fromAddress) {
    throw new Error("Cloudflare Email Service credentials and sender are not configured");
  }
  return values as { accountId: string; apiToken: string; fromAddress: string; fromName: string };
}

export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
  fetchImpl: FetchLike = fetch,
): Promise<EmailDeliveryResult> {
  let config;
  try {
    config = emailConfig();
  } catch {
    return { outcome: "failed", errorCode: "PROVIDER_NOT_CONFIGURED" };
  }

  const startedAt = Date.now();
  try {
    const response = await fetchImpl(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
          "X-Correlation-ID": input.correlationId,
        },
        body: JSON.stringify({
          from: { address: config.fromAddress, name: config.fromName },
          to: input.to,
          subject: "Verify your TermSpace email",
          text: `Verify your email to use TermSpace creator features. This link expires in 30 minutes:\n\n${input.verificationUrl}\n\nIf you did not create this account, you can ignore this message.`,
          html: `<p>Verify your email to use TermSpace creator features.</p><p><a href="${input.verificationUrl}">Verify email</a></p><p>This link expires in 30 minutes. If you did not create this account, you can ignore this message.</p>`,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    let body: CloudflareEmailResponse | undefined;
    try { body = await response.json() as CloudflareEmailResponse; } catch { /* Provider body is optional. */ }
    const latencyMs = Date.now() - startedAt;
    console.info(JSON.stringify({ event: "transactional_email_delivery", correlationId: input.correlationId, statusCode: response.status, latencyMs }));

    if (response.ok && ((body?.result?.delivered?.length ?? 0) > 0 || (body?.result?.queued?.length ?? 0) > 0)) {
      return { outcome: "sent", statusCode: response.status };
    }
    if (response.status === 429 || response.status >= 500) {
      return { outcome: "retry", statusCode: response.status, errorCode: `HTTP_${response.status}` };
    }
    return { outcome: "failed", statusCode: response.status, errorCode: body?.result?.permanent_bounces?.length ? "PERMANENT_BOUNCE" : `HTTP_${response.status}` };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.warn(JSON.stringify({ event: "transactional_email_delivery", correlationId: input.correlationId, outcome: timeout ? "timeout" : "network_error", latencyMs }));
    return { outcome: "retry", errorCode: timeout ? "TIMEOUT" : "NETWORK_ERROR" };
  }
}
