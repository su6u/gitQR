import { Pill } from "./pill";
import { PlaygroundPanel } from "./playground-panel";
import { QrBoard } from "./qr-board";

export function Playground() {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-white">
      <QrBoard
        className="playground-enter-item absolute inset-0"
        style={{ animationDelay: "0ms" }}
      />
      <div className="pointer-events-none absolute inset-0 p-4">
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_clamp(260px,28%,380px)] gap-3">
          <div />
          <Pill
            className="playground-enter-item pointer-events-auto min-h-0 h-full rounded-[56px]"
            style={{ animationDelay: "60ms" }}
          >
            <PlaygroundPanel />
          </Pill>
        </div>
      </div>
    </main>
  );
}
