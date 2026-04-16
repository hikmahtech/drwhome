"use client";
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <section>
      <h1 className="text-lg">&gt; error</h1>
      <p className="text-muted">something broke.</p>
      <button type="button" onClick={reset} className="border px-3 py-1 mt-4">
        retry
      </button>
    </section>
  );
}
