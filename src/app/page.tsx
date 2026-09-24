import { NAME, ROLE, SPACE_ITEMS, TAGLINE } from "@/content/site";

/** Space. The visible page is the WebGL cloud; this is its accessible mirror. */
export default function SpacePage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <p>{TAGLINE}</p>
      <h2>Space</h2>
      <ul>
        {SPACE_ITEMS.map((item) => (
          <li key={item.id}>
            <article>
              <h3>{item.title}</h3>
              <p>{item.category}</p>
              <p>{item.description.join(" ")}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
