"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const assignmentSchema = z.object({
  analystId: z.string().min(1),
  businessId: z.string().min(1)
});

export async function assignBusinessToAnalyst(formData: FormData) {
  const profile = await requireRole(["super_admin"]);
  const parsed = assignmentSchema.safeParse({
    analystId: formData.get("analystId"),
    businessId: formData.get("businessId")
  });

  if (!parsed.success) {
    redirect("/dashboard/super-admin?assignment=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/super-admin?assignment=demo");
  }

  const supabase = await createSupabaseRouteClient();
  const { analystId, businessId } = parsed.data;

  const { data: assignment, error: assignmentError } = await supabase
    .from("analyst_assignments")
    .insert({
      analyst_user_id: analystId,
      business_id: businessId,
      assigned_by: profile.id,
      status: "active"
    })
    .select("id")
    .single();

  if (assignmentError || !assignment) {
    redirect(`/dashboard/super-admin?assignment=${encodeURIComponent(assignmentError?.message ?? "failed")}`);
  }

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "analyst_assigned",
    entity_type: "analyst_assignment",
    entity_id: assignment.id,
    new_value: {
      analyst_user_id: analystId,
      business_id: businessId,
      assigned_by: profile.id
    },
    metadata: {
      source: "super_admin_dashboard"
    }
  });

  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/super-admin?assignment=success");
}
