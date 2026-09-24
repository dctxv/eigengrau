import gsap from "gsap";

/**
 * A word that trails the pointer, 32px down and right of its tip, white with
 * mix-blend-mode: difference (spec 4.5). Plain DOM controller, shared by the
 * Creative Space and Projects stages.
 */
export class CursorLabel {
  private el: HTMLElement;
  private stage: HTMLElement;
  private tx = -200;
  private ty = -200;
  private x = -200;
  private y = -200;
  private text = "";
  private tick: (t: number, dt: number) => void;
  private onMove: (e: PointerEvent) => void;

  constructor(el: HTMLElement, stage: HTMLElement) {
    this.el = el;
    this.stage = stage;
    this.onMove = (e) => {
      const r = this.stage.getBoundingClientRect();
      this.tx = e.clientX - r.left;
      this.ty = e.clientY - r.top;
    };
    this.tick = (_t, dtMs) => {
      const k = 1 - Math.pow(0.8, Math.min(dtMs, 100) / (1000 / 60)); // 0.2 per frame at 60fps
      this.x += (this.tx - this.x) * k;
      this.y += (this.ty - this.y) * k;
      this.el.style.transform = `translate(-50%, -50%) translate(${this.x}px, ${this.y}px)`;
    };
    window.addEventListener("pointermove", this.onMove);
    gsap.ticker.add(this.tick);
  }

  /** Show `text`, or hide when null. Fades over 0.25s with the in-out curve. */
  set(text: string | null) {
    if ((text ?? "") === this.text) return;
    this.text = text ?? "";
    if (text) {
      this.el.textContent = text;
      gsap.to(this.el, { opacity: 1, duration: 0.25, ease: "power2.inOut", overwrite: true });
    } else {
      gsap.to(this.el, { opacity: 0, duration: 0.25, ease: "power2.inOut", overwrite: true });
    }
  }

  destroy() {
    window.removeEventListener("pointermove", this.onMove);
    gsap.ticker.remove(this.tick);
  }
}
