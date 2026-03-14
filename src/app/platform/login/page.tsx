import { redirect } from "next/navigation";

/** Login unificado está en /. Redirigir para no romper enlaces viejos. */
export default function PlatformLoginRedirect() {
  redirect("/");
}
