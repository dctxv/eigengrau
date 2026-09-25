import { NAME, ROLE, TAGLINE } from "@/content/site";

/** Space. The visible page is Urchi alone in its room; this is its accessible mirror, with the game's door. */
export default function SpacePage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <p>{TAGLINE}</p>
      <p>Urchi lives here, a small spiked head with two coloured eyes that watches the pointer and keeps the place while I am out.</p>
      <p>
        <a href="/threshold">Threshold, the daily game</a>
      </p>
    </section>
  );
}
