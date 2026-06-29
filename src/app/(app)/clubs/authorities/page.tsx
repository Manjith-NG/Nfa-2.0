import { redirect } from "next/navigation";

export default function ClubAuthoritiesPage() {
  redirect("/authorities?tab=clubs");
}
