"use client";
import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";

type Case = {
  id: string;
  targetType: string;
  targetId: string;
  state: string;
  severity: string;
  version: number;
  publicReason: string | null;
  reports?: Array<{ reason: string; explanation: string }>;
  events: Array<{
    id: string;
    action: string;
    publicReason: string;
    internalNote?: string | null;
  }>;
  restrictions: Array<{ decisionEventId: string; revokedAt: string | null }>;
  appeals: Array<{
    id: string;
    outcome: string;
    publicReason: string | null;
    explanation?: string;
    evidence?: string;
  }>;
};
export function TrustCases({ staff = false }: { staff?: boolean }) {
  const { fa, t } = useLocale();
  const session = useMarketplaceSession();
  const [items, setItems] = useState<Case[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request<{ data: Case[]; meta: { totalPages: number } }>(
      `/api/marketplace/${staff ? "moderation/" : ""}cases?page=${page}`,
      { signal: controller.signal },
    )
      .then((result) => {
        setItems(result.data);
        setPages(result.meta.totalPages);
        setError("");
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [staff, page, refresh]);
  async function submit(path: string, body: unknown) {
    setBusy(true);
    try {
      await request(`/api/marketplace/${path}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1 className="editorial text-4xl">
        {fa ? "پرونده‌ها و اعتراض‌ها" : "Cases and appeals"}
      </h1>
      {staff && session.marketplaceRoles.includes("administrator") && (
        <details className="mt-6 rounded-lg border p-4">
          <summary>
            {fa ? "بازکردن پرونده حساب" : "Open an account case"}
          </summary>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              void submit("moderation/account-cases", {
                userId: fields.get("userId"),
                publicReason: fields.get("reason"),
                internalNote: fields.get("note") || undefined,
              });
            }}
          >
            <label className="block">
              {fa
                ? "شناسه حساب از شواهد داخلی"
                : "Account ID from internal evidence"}
              <input
                name="userId"
                required
                maxLength={100}
                className="mt-2 w-full rounded border bg-surface p-2"
              />
            </label>
            <DecisionReason />
            <Button disabled={busy}>
              {fa ? "بازکردن پرونده" : "Open case"}
            </Button>
          </form>
        </details>
      )}
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}{" "}
          <Button onClick={() => setRefresh((value) => value + 1)}>
            {t.discovery.retry}
          </Button>
        </p>
      )}
      {!items && !error && <p role="status">{t.wait}</p>}
      {items?.length === 0 && (
        <p className="mt-6">{fa ? "پرونده‌ای وجود ندارد." : "No cases yet."}</p>
      )}
      {items?.map((item) => (
        <article className="mt-6 rounded-xl border p-5" key={item.id}>
          <h2 className="text-xl font-semibold">
            {item.targetType} · {item.targetId}
          </h2>
          <p className="mt-2">
            {item.state} · {item.severity}
          </p>
          <p className="mt-2">{item.publicReason}</p>
          {staff && (
            <details className="mt-4">
              <summary>
                {fa ? "شواهد و سوابق خصوصی" : "Evidence and private history"}
              </summary>
              {item.reports?.map((report, index) => (
                <p className="mt-2 whitespace-pre-wrap" key={index}>
                  {report.reason}: {report.explanation}
                </p>
              ))}
              {item.events.map((event) => (
                <p key={event.id} className="mt-2 whitespace-pre-wrap">
                  {event.action}: {event.publicReason} {event.internalNote}
                </p>
              ))}
            </details>
          )}
          {staff ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                void submit(`moderation/cases/${item.id}`, {
                  expectedVersion: item.version,
                  action: fields.get("action"),
                  severity: fields.get("severity"),
                  publicReason: fields.get("reason"),
                  internalNote: fields.get("note") || undefined,
                });
              }}
            >
              <label className="block">
                {fa ? "اقدام" : "Action"}
                <select
                  name="action"
                  className="ml-3 rounded border bg-surface p-2"
                >
                  {["TRIAGE", "INVESTIGATE", "DISMISS", "RESTRICT", "LIFT"].map(
                    (action) => (
                      <option key={action}>{action}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="block">
                {fa ? "شدت" : "Severity"}
                <select
                  name="severity"
                  defaultValue={item.severity}
                  className="ml-3 rounded border bg-surface p-2"
                >
                  <option>STANDARD</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </label>
              <DecisionReason />
              <Button disabled={busy}>
                {fa ? "ثبت تصمیم" : "Record decision"}
              </Button>
            </form>
          ) : (
            item.events.some((event) =>
              ["RESTRICT", "DISMISS", "LIFT"].includes(event.action),
            ) && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const fields = new FormData(event.currentTarget);
                  void submit(
                    `cases/${item.id}/appeals`,
                    Object.fromEntries(fields),
                  );
                }}
              >
                <label className="block">
                  {fa ? "تصمیم مورد اعتراض" : "Decision to appeal"}
                  <select
                    name="decisionEventId"
                    className="mt-2 w-full rounded border bg-surface p-2"
                  >
                    {item.events
                      .filter((event) =>
                        ["RESTRICT", "DISMISS", "LIFT"].includes(event.action),
                      )
                      .map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.action} · {event.publicReason}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block">
                  {fa ? "توضیح اعتراض" : "Appeal explanation"}
                  <textarea
                    name="explanation"
                    required
                    minLength={10}
                    maxLength={4000}
                    className="mt-2 w-full rounded border bg-surface p-2"
                  />
                </label>
                <label className="block">
                  {fa ? "شواهد جدید" : "New supporting evidence"}
                  <textarea
                    name="evidence"
                    required
                    minLength={10}
                    maxLength={4000}
                    className="mt-2 w-full rounded border bg-surface p-2"
                  />
                </label>
                <Button disabled={busy}>
                  {fa ? "ارسال اعتراض" : "Submit appeal"}
                </Button>
              </form>
            )
          )}
          {item.appeals.map((appeal) => (
            <div className="mt-4 border-t pt-4" key={appeal.id}>
              <p>
                {fa ? "اعتراض" : "Appeal"}: {appeal.outcome} ·{" "}
                {appeal.publicReason}
              </p>
              {staff && (
                <>
                  <p className="whitespace-pre-wrap">{appeal.explanation}</p>
                  <p className="whitespace-pre-wrap">{appeal.evidence}</p>
                  {appeal.outcome === "PENDING" && (
                    <form
                      className="mt-3 space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const fields = new FormData(event.currentTarget);
                        void submit(`moderation/appeals/${appeal.id}`, {
                          expectedVersion: item.version,
                          outcome: fields.get("outcome"),
                          publicReason: fields.get("reason"),
                          internalNote: fields.get("note") || undefined,
                        });
                      }}
                    >
                      <label>
                        {fa ? "نتیجه اعتراض" : "Appeal outcome"}
                        <select
                          name="outcome"
                          className="ml-3 rounded border bg-surface p-2"
                        >
                          <option>UPHELD</option>
                          <option>MODIFIED</option>
                          <option>REVERSED</option>
                        </select>
                      </label>
                      <DecisionReason />
                      <Button disabled={busy}>
                        {fa ? "ثبت نتیجه" : "Record outcome"}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          ))}
        </article>
      ))}
      <div className="mt-6 flex gap-3">
        <Button disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>
          {fa ? "قبلی" : "Previous"}
        </Button>
        <span>
          {page} / {Math.max(1, pages)}
        </span>
        <Button
          disabled={page >= pages || busy}
          onClick={() => setPage(page + 1)}
        >
          {fa ? "بعدی" : "Next"}
        </Button>
      </div>
    </section>
  );
}
function DecisionReason() {
  const { fa } = useLocale();
  return (
    <>
      <label className="block">
        {fa
          ? "دلیل عمومی و شرایط بازگردانی"
          : "Public reason and reinstatement conditions"}
        <textarea
          name="reason"
          required
          minLength={10}
          maxLength={1000}
          className="mt-2 w-full rounded border bg-surface p-2"
        />
      </label>
      <label className="block">
        {fa ? "یادداشت خصوصی" : "Private evidence note"}
        <textarea
          name="note"
          maxLength={4000}
          className="mt-2 w-full rounded border bg-surface p-2"
        />
      </label>
    </>
  );
}
