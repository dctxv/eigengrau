/** --app-h and --vv-bottom-inset, set from JS so mobile 100vh never jumps (spec 12). */
export function installViewportVars() {
  const root = document.documentElement;
  const set = () => {
    root.style.setProperty("--app-h", `${window.innerHeight}px`);
    const vv = window.visualViewport;
    const inset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    root.style.setProperty("--vv-bottom-inset", `${inset}px`);
  };
  set();
  window.addEventListener("resize", set);
  window.visualViewport?.addEventListener("resize", set);
  return () => {
    window.removeEventListener("resize", set);
    window.visualViewport?.removeEventListener("resize", set);
  };
}
