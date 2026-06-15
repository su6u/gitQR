import { Pill } from "./pill";
import { QrBoard } from "./qr-board";

export function Studio() {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-white">
      <QrBoard
        className="studio-enter-item absolute inset-0"
        style={{ animationDelay: "0ms" }}
      />
      <div className="pointer-events-none absolute inset-0 p-4">
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_clamp(230px,23%,320px)] gap-3">
          <div />
          <Pill
            className="studio-enter-item pointer-events-auto min-h-0 h-full rounded-[56px]"
            style={{ animationDelay: "60ms" }}
          />
        </div>
      </div>
    </main>
  );
}
