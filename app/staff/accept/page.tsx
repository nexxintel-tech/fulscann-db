import { acceptStaffInvitation } from "@/app/staff/accept/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AcceptStaffInvitationPageProps = {
  searchParams: Promise<{ token?: string; action?: string }>;
};

export default async function AcceptStaffInvitationPage({ searchParams }: AcceptStaffInvitationPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Accept staff invitation</h1>
        <p>Join the assigned business workspace to submit department reports and supporting evidence.</p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
      </section>

      <section className="card" style={{ maxWidth: 560 }}>
        {!hasSupabaseConfig() ? (
          <p style={{ marginBottom: 16 }}>Demo mode is active. Acceptance will preview the staff onboarding flow.</p>
        ) : null}
        <form action={acceptStaffInvitation} className="form">
          <input type="hidden" name="token" value={token} />
          <label>
            Full name
            <input name="fullName" minLength={2} maxLength={120} placeholder="Your name" />
          </label>
          <button className="button primary" type="submit" disabled={!token}>
            Accept invitation
          </button>
        </form>
        {!token ? <p style={{ marginTop: 16 }}>Open this page from a staff invitation link.</p> : null}
      </section>
    </div>
  );
}

function getActionMessage(status: string) {
  if (status === "invalid") return "The invitation link is incomplete or invalid.";
  if (status === "not-found") return "This invitation could not be found.";
  if (status === "email-mismatch") return "Sign in with the email address that received this invitation.";
  if (status === "server-config") return "Supabase service role configuration is required to accept invitations securely.";
  return `Invitation action failed: ${status}`;
}
