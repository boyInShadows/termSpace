"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main role="alert" style={{ maxWidth: 640, margin: "20vh auto", padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>TermSpace is temporarily unavailable</h1>
          <p>فضای ترم موقتاً در دسترس نیست.</p>
          <button onClick={reset} style={{ padding: "10px 16px", cursor: "pointer" }}>Try again / تلاش دوباره</button>
        </main>
      </body>
    </html>
  );
}
