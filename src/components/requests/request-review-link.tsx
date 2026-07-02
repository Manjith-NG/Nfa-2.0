import Link from "next/link";

export function RequestReviewLink({
  requestId,
  className = "nfa-btn-primary py-1.5 text-xs",
}: {
  requestId: string;
  className?: string;
}) {
  return (
    <Link href={`/requests/${requestId}`} className={className}>
      Review
    </Link>
  );
}
