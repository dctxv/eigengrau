import Link from "next/link";

export default function NotFound() {
  return (
    <main className="case">
      <p className="case-text">Nothing here.</p>
      <Link href="/" className="case-back">
        Back
      </Link>
    </main>
  );
}
