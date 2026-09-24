import { redirect } from "next/navigation";

/** Threshold has no page of its own: the game lives behind the resident on Space. */
export default function ThresholdPage() {
  redirect("/#threshold");
}
