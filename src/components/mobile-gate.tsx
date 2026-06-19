export function MobileGate() {
  return (
    <main className="flex h-svh w-full items-center justify-center bg-white px-6">
      <div
        className="playground-enter-item max-w-xs text-center"
        style={{ animationDelay: "0ms" }}
      >
        <p className="text-pretty text-base leading-relaxed text-muted-foreground">
          Use desktop to play on this ground{" "}
          <span
            className="font-[family-name:var(--font-caveat)] text-[1.35em] text-foreground"
            aria-hidden
          >
            &gt;.&lt;
          </span>
        </p>
      </div>
    </main>
  );
}
