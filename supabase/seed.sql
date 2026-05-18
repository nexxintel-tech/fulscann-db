insert into profiles (id, full_name, email, platform_role) values
  ('00000000-0000-4000-8000-000000000001', 'Fulscann Super Admin', 'admin@fulscann.com', 'super_admin'),
  ('00000000-0000-4000-8000-000000000002', 'Mira Okonkwo', 'mira@fulscann.com', 'analyst'),
  ('00000000-0000-4000-8000-000000000003', 'Tade Bello', 'tade@fulscann.com', 'analyst'),
  ('00000000-0000-4000-8000-000000000004', 'Adenike CEO', 'ceo@adenikefoods.com', 'business_user')
on conflict (id) do nothing;

insert into businesses (
  id,
  legal_name,
  sector,
  owner_user_id,
  onboarding_progress,
  assessment_complete,
  kpi_setup_complete,
  current_veriscore,
  previous_veriscore,
  current_ic_score,
  previous_ic_score,
  evidence_completion,
  integrity_report_ready,
  last_activity_at
) values
  ('10000000-0000-4000-8000-000000000001', 'Adenike Foods Ltd', 'Food processing', '00000000-0000-4000-8000-000000000004', 86, true, true, 78, 74, 71, 69, 82, true, now() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000002', 'Northline Supplies', 'Procurement', '00000000-0000-4000-8000-000000000004', 64, true, false, 66, 70, 58, 67, 49, false, now() - interval '9 days'),
  ('10000000-0000-4000-8000-000000000003', 'MetroCare Clinics', 'Healthcare', '00000000-0000-4000-8000-000000000004', 92, true, true, 83, 81, 80, 76, 91, true, now()),
  ('10000000-0000-4000-8000-000000000004', 'Zuma Retail Partners', 'Retail', '00000000-0000-4000-8000-000000000004', 38, false, false, 42, 42, 46, 50, 28, false, now() - interval '16 days'),
  ('10000000-0000-4000-8000-000000000005', 'Bridgefield Logistics', 'Logistics', '00000000-0000-4000-8000-000000000004', 22, false, false, 35, 35, 40, 40, 18, false, now() - interval '5 days')
on conflict (id) do nothing;

insert into business_users (business_id, user_id, role, status) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'ceo', 'active'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'ceo', 'active'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'ceo', 'active'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'ceo', 'active')
on conflict (business_id, user_id) do nothing;

insert into analyst_assignments (analyst_user_id, business_id, assigned_by, status) values
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'active'),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'active'),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'active'),
  ('00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'active')
on conflict (analyst_user_id, business_id) do nothing;

insert into department_reports (id, business_id, department, status, value, evidence_count, submitted_by) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'sales', 'review_ready', 2400000, 5, '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'finance', 'submitted', 2300000, 4, '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'sales', 'submitted', 1900000, 2, '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'finance', 'draft', 1200000, 0, '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'operations', 'approved', 880000, 6, '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into control_exceptions (id, business_id, title, risk_level, status, assigned_to, created_at) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Sales-finance mismatch', 'Orange', 'open', '00000000-0000-4000-8000-000000000002', now() - interval '4 days'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 'Missing expense evidence', 'Red', 'open', '00000000-0000-4000-8000-000000000002', now() - interval '11 days'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Procurement approval gap', 'Yellow', 'in_review', '00000000-0000-4000-8000-000000000002', now() - interval '2 days')
on conflict (id) do nothing;

insert into analyst_notes (id, business_id, analyst_user_id, note_type, body, visibility, created_at) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'clarification_request', 'Please clarify the procurement approval gap before the Integrity Report is shared.', 'business_visible', now() - interval '2 hours'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'clarification_request', 'Finance inflow is lower than reported sales. Add supporting evidence or explain the timing difference.', 'business_visible', now() - interval '90 minutes')
on conflict (id) do nothing;

insert into institution_access (id, business_id, institution_name, institution_email, status, granted_by, created_at) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'TrustBank Credit Desk', 'credit@trustbank.example', 'active', '00000000-0000-4000-8000-000000000004', now() - interval '30 minutes')
on conflict (id) do nothing;

insert into departments (id, business_id, name, department_type, created_by) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Sales', 'sales', '00000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Finance', 'finance', '00000000-0000-4000-8000-000000000004')
on conflict (business_id, department_type) do nothing;

insert into staff_invitations (id, business_id, department_id, email, role, status, invitation_token, invited_by) values
  ('90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'sales@adenikefoods.example', 'sales_officer', 'pending', 'demo-sales-invite', '00000000-0000-4000-8000-000000000004')
on conflict (business_id, email) do nothing;

insert into kpi_targets (id, business_id, name, target_value, unit, period, created_by) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Sales-to-Finance Match Rate', 95, '%', 'monthly', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into veriscore_results (id, business_id, veriscore, version, created_by) values
  ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 78, 'v1.0', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into ic_scores (id, business_id, score, version, created_by) values
  ('81000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 71, 'v1.0', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into evidence_files (id, business_id, report_id, uploaded_by, file_name, file_type, storage_path, file_size, evidence_level, verification_status) values
  ('82000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'sales-invoices-may.pdf', 'invoice', '10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/sales-invoices-may.pdf', 128000, 1, 'pending'),
  ('82000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'bank-inflow-may.pdf', 'bank_statement', '10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000002/bank-inflow-may.pdf', 256000, 2, 'pending')
on conflict (id) do nothing;
