import Link from "next/link";

export function DemoBanner({ role }: { role: string }) {
  return (
    <section className="notice">
      Demo route: {role}. This bypasses authentication and uses local sample data only. Secure routes remain under{" "}
      <Link href="/dashboard/super-admin">/dashboard</Link>.
    </section>
  );
}
