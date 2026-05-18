"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseConfig, hasSupabaseServiceConfig } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/server";

const acceptInvitationSchema = z.object({
  token: z.string().min(12),
  fullName: z.string().trim().min(2).max(120).optional()
});

type InvitationRow = {
  id: string;
  business_id: string;
  department_id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked";
};

export async function acceptStaffInvitation(formData: FormData) {
  const parsed = acceptInvitationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/staff/accept?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo-accepted");
  if (!hasSupabaseServiceConfig()) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=server-config`);
  }

  const routeClient = await createSupabaseRouteClient();
  const {
    data: { user },
    error: userError
  } = await routeClient.auth.getUser();

  if (userError || !user || !user.email) {
    redirect("/login?error=staff-invite-login");
  }

  const admin = createSupabaseAdminClient();
  const { data: invitation, error: invitationError } = await admin
    .from("staff_invitations")
    .select("id, business_id, department_id, email, role, status")
    .eq("invitation_token", parsed.data.token)
    .single<InvitationRow>();

  if (invitationError || !invitation) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=not-found`);
  }

  if (invitation.status !== "pending") {
    redirect("/dashboard/staff?action=invite-already-used");
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=email-mismatch`);
  }

  const fullName = parsed.data.fullName || user.user_metadata?.full_name || user.email;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      platform_role: "business_user"
    },
    { onConflict: "id" }
  );

  if (profileError) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=${encodeURIComponent(profileError.message)}`);
  }

  const { error: membershipError } = await admin.from("business_users").upsert(
    {
      business_id: invitation.business_id,
      user_id: user.id,
      role: invitation.role,
      department_id: invitation.department_id,
      status: "active"
    },
    { onConflict: "business_id,user_id" }
  );

  if (membershipError) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=${encodeURIComponent(membershipError.message)}`);
  }

  const { error: updateError } = await admin
    .from("staff_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  if (updateError) {
    redirect(`/staff/accept?token=${encodeURIComponent(parsed.data.token)}&action=${encodeURIComponent(updateError.message)}`);
  }

  await admin.from("audit_events").insert({
    business_id: invitation.business_id,
    actor_user_id: user.id,
    event_type: "staff_accepted_invitation",
    entity_type: "staff_invitation",
    entity_id: invitation.id,
    metadata: { role: invitation.role, department_id: invitation.department_id }
  });

  redirect("/dashboard/staff?action=invite-accepted");
}
