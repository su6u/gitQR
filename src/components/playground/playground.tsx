import { Pill } from "./pill";
import { PlaygroundNavbar } from "./playground-navbar";
import { PlaygroundPanel } from "./playground-panel";
import { PlaygroundProvider } from "./playground-provider";
import { QrBoard } from "./qr-board";

export function Playground() {
  return (
    <PlaygroundProvider>
      <PlaygroundMain />
    </PlaygroundProvider>
  );
}

function PlaygroundMain() {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-white">
      <QrBoard
        className="playground-enter-item absolute inset-0"
        style={{ animationDelay: "0ms" }}
      />
      <div className="pointer-events-none absolute inset-0 p-4">
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_clamp(260px,28%,380px)] gap-3">
          <PlaygroundNavbar
            className="playground-enter-item pointer-events-auto self-start ml-6"
            style={{ animationDelay: "40ms" }}
          />
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
