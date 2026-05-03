import { createRoot } from "react-dom/client";
import "./index.css";

// Boot-level error fallback.
// This runs before React mounts and catches import-time or render-time crashes
// that would otherwise leave a completely blank white screen with no information.
// It does NOT replace the in-app AppErrorBoundary; it catches failures that
// happen before AppErrorBoundary ever has a chance to render.

function renderBootError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100dvh;display:grid;place-items:center;background:#120617;color:#fff;font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box">
      <div style="max-width:560px;width:100%;background:rgba(255,0,0,.08);border:1px solid rgba(255,80,80,.35);border-radius:14px;padding:28px">
        <h2 style="margin:0 0 10px;color:#ff6b6b;font-size:20px">Candy CrackZZZ — startup error</h2>
        <p style="margin:0 0 14px;color:rgba(255,255,255,.85);line-height:1.5;word-break:break-word">${msg}</p>
        ${stack ? `<pre style="font-size:11px;overflow:auto;max-height:220px;background:rgba(0,0,0,.4);padding:12px;border-radius:8px;color:rgba(255,255,255,.65);white-space:pre-wrap;word-break:break-word;margin:0 0 16px">${stack}</pre>` : ""}
        <button onclick="location.reload()" style="padding:10px 22px;background:#ff4fd8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">Reload</button>
      </div>
    </div>
  `;
}

// Catch uncaught errors and unhandled promise rejections that escape React.
window.addEventListener("error", (e) => {
  if (e.error) renderBootError(e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  renderBootError(e.reason);
});

// Dynamically import App so any import-time crash is caught here rather than
// crashing the module silently and leaving a blank screen.
try {
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  renderBootError(err);
}
