insert into public.business_kpis (
  business_id,
  department_id,
  kpi_key,
  name,
  description,
  measurement_type,
  unit,
  default_frequency,
  evidence_requirements,
  ic_rule_links,
  score_factor_links,
  is_default,
  is_active,
  created_by
)
select
  departments.business_id,
  departments.id,
  seed.kpi_key,
  seed.name,
  seed.description,
  seed.measurement_type,
  seed.unit,
  seed.default_frequency,
  seed.evidence_requirements,
  seed.ic_rule_links,
  seed.score_factor_links,
  true,
  true,
  businesses.owner_user_id
from public.departments
join public.businesses on businesses.id = departments.business_id
cross join (
  values
    (
      'monthly_sales_value',
      'Monthly Sales Value',
      'Total reported sales for the period.',
      'currency',
      'NGN',
      'monthly',
      '["sales report", "invoices", "customer/order records"]'::jsonb,
      '["sales_report_present", "sales_evidence_quality"]'::jsonb,
      '["reporting_completeness", "evidence_quality"]'::jsonb
    ),
    (
      'sales_target_achievement',
      'Sales Target Achievement',
      'Actual sales compared with the CEO sales target.',
      'percentage',
      '%',
      'monthly',
      '["CEO sales target", "sales report"]'::jsonb,
      '["sales_report_present"]'::jsonb,
      '["performance_alignment"]'::jsonb
    ),
    (
      'invoice_completion_rate',
      'Invoice Completion Rate',
      'Sales records supported by valid invoices.',
      'percentage',
      '%',
      'monthly',
      '["uploaded invoices"]'::jsonb,
      '["sales_evidence_quality", "invoice_evidence_required"]'::jsonb,
      '["evidence_quality"]'::jsonb
    ),
    (
      'sales_to_finance_match_rate',
      'Sales-to-Finance Match Rate',
      'Sales confirmed by finance inflow.',
      'percentage',
      '%',
      'monthly',
      '["sales report", "invoices", "finance inflow report", "bank/payment evidence"]'::jsonb,
      '["sales_finance_mismatch"]'::jsonb,
      '["financial_alignment", "cross_department_consistency"]'::jsonb
    ),
    (
      'sales_to_inventory_match_rate',
      'Sales-to-Inventory Match Rate',
      'Sales supported by stock or service delivery evidence.',
      'percentage',
      '%',
      'monthly',
      '["invoices", "inventory movement record", "delivery/service completion evidence"]'::jsonb,
      '["inventory_evidence_validation"]'::jsonb,
      '["operational_consistency", "evidence_quality"]'::jsonb
    ),
    (
      'customer_traceability_rate',
      'Customer Traceability Rate',
      'Sales linked to identifiable customers.',
      'percentage',
      '%',
      'monthly',
      '["customer name/code", "order reference", "invoice/customer record"]'::jsonb,
      '["sales_record_traceability"]'::jsonb,
      '["documentation_quality"]'::jsonb
    ),
    (
      'revenue_collection_rate',
      'Revenue Collection Rate',
      'Paid sales compared with total sales.',
      'percentage',
      '%',
      'monthly',
      '["payment receipts", "finance inflow confirmation", "bank/payment records"]'::jsonb,
      '["finance_inflow_confirmation", "sales_finance_mismatch"]'::jsonb,
      '["financial_alignment"]'::jsonb
    ),
    (
      'outstanding_receivables',
      'Outstanding Receivables',
      'Sales not yet paid.',
      'currency',
      'NGN',
      'monthly',
      '["unpaid invoice list", "customer receivable records"]'::jsonb,
      '["receivables_monitoring"]'::jsonb,
      '["financial_discipline"]'::jsonb
    ),
    (
      'sales_exception_rate',
      'Sales Exception Rate',
      'Sales records flagged by IC.',
      'percentage',
      '%',
      'monthly',
      '["IC exception records linked to Sales"]'::jsonb,
      '["sales_exception_count"]'::jsonb,
      '["anomaly_rate", "control_exception_behavior"]'::jsonb
    ),
    (
      'repeat_customer_rate',
      'Repeat Customer Rate',
      'Repeat customers within the reporting period.',
      'percentage',
      '%',
      'monthly',
      '["customer records", "repeat sales history"]'::jsonb,
      '["customer_traceability_check"]'::jsonb,
      '["customer_consistency"]'::jsonb
    )
) as seed (
  kpi_key,
  name,
  description,
  measurement_type,
  unit,
  default_frequency,
  evidence_requirements,
  ic_rule_links,
  score_factor_links
)
where departments.department_type = 'sales'
on conflict (business_id, department_id, kpi_key) do nothing;
