"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { STAFF_INVITATION_ROLES } from "@/lib/staff/roles";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  businessId: z.string().min(1),
  departmentId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(STAFF_INVITATION_ROLES)
});

export async function inviteStaffMember(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, departmentId, email, role } = parsed.data;
  const invitationToken = globalThis.crypto.randomUUID().replaceAll("-", "");
  const { data: invitation, error } = await supabase
    .from("staff_invitations")
    .insert({
      business_id: businessId,
      department_id: departmentId,
      email,
      role,
      status: "pending",
      invitation_token: invitationToken,
      invited_by: profile.id
    })
    .select("id")
    .single();

  if (error || !invitation) redirect(`/dashboard/ceo/staff?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "ceo_invited_staff",
    entity_type: "staff_invitation",
    entity_id: invitation.id,
    metadata: { email, role, department_id: departmentId, invitation_token: invitationToken }
  });

  revalidatePath("/dashboard/ceo/staff");
  revalidatePath("/dashboard/staff");
  redirect("/dashboard/ceo/staff?action=staff-invited");
}
