export type HelpRole = {
  title: string;
  summary: string;
  can: string[];
  boundary?: string;
};

export type HelpStepSection = {
  title: string;
  intro: string;
  steps: string[];
  details?: string[];
};

export type Checklist = {
  title: string;
  items: string[];
};

export const platformQuestions = [
  "Is our business properly structured?",
  "Are our departments reporting correctly?",
  "Can we prove our sales, finance, procurement, and operational claims?",
  "Are there unresolved risks or control gaps?",
  "Are we improving over time?",
  "Are we ready to be reviewed by banks, partners, financiers, insurers, or institutions?"
];

export const platformActions = [
  "Create a business profile",
  "Complete a readiness assessment",
  "Receive a VeriScore",
  "Set KPIs",
  "Create departments",
  "Invite staff and department users",
  "Submit department reports",
  "Upload supporting evidence",
  "Detect control exceptions",
  "Resolve internal control issues",
  "Track IC Score movement",
  "Build evidence confidence",
  "Share approved Integrity Reports with institutions"
];

export const keyTerms = [
  {
    title: "Business Profile",
    body: "A business profile contains core business information such as business identity, sector, location, structure, ownership, and operating details."
  },
  {
    title: "VeriScore",
    body: "VeriScore measures business structure, maturity, and readiness based on the onboarding assessment and business profile."
  },
  {
    title: "KPI",
    body: "A KPI is a measurable target the business wants to track. In Fulscann-DB, KPIs are connected to departments, evidence, reports, and internal control checks.",
    examples: [
      "Monthly Sales Value",
      "Sales-to-Finance Match Rate",
      "Invoice Completion Rate",
      "Procurement Approval Completion Rate",
      "Evidence Completion Rate",
      "Order Fulfillment Rate"
    ]
  },
  {
    title: "Department",
    body: "A department is a business unit responsible for specific reports, evidence, and actions.",
    examples: ["Sales", "Finance", "Procurement", "Operations", "HR/Admin"]
  },
  {
    title: "Evidence",
    body: "Evidence is any document, file, record, or confirmation used to support a business claim.",
    examples: ["Invoices", "Receipts", "Bank statements", "Delivery notes", "Inventory records", "Purchase approvals", "Staff records", "Payment confirmations"]
  },
  {
    title: "IC Engine",
    body: "The Internal Control Engine checks whether reports, evidence, and business records agree with one another.",
    examples: ["Missing reports", "Weak evidence", "Sales-Finance mismatch", "Procurement approval gaps", "Missing delivery confirmation", "Repeated unresolved issues"]
  },
  {
    title: "IC Score",
    body: "The IC Score reflects how well a business is controlled, documented, and internally consistent."
  },
  {
    title: "Exception",
    body: "An exception is a control issue detected by the system, such as missing evidence, mismatched figures, or an unresolved department issue."
  },
  {
    title: "Integrity Report",
    body: "The Integrity Report is an approved trust report that summarizes business readiness, control status, evidence confidence, and risk indicators. It can be shared with institutions only when the CEO grants access."
  }
];

export const roles: HelpRole[] = [
  {
    title: "CEO / Business Owner",
    summary: "The CEO owns the business account and controls the main business setup.",
    can: [
      "Create the business profile",
      "Complete the assessment and view VeriScore",
      "Set KPIs and create departments",
      "Invite Staff and Departmental Heads",
      "Review reports and approve sensitive items",
      "Resolve exceptions and view IC Score",
      "Share Integrity Reports with institutions"
    ]
  },
  {
    title: "Departmental Head",
    summary: "The Departmental Head monitors compliance within an assigned department.",
    can: [
      "View department reports",
      "Monitor evidence gaps",
      "See exceptions linked to their department",
      "Request corrections or missing evidence",
      "Add department comments",
      "Mark department responses ready for CEO or Analyst review",
      "Escalate unresolved issues to the CEO"
    ],
    boundary: "Departmental Heads do not share external reports and do not access unrelated departments by default."
  },
  {
    title: "Staff",
    summary: "Staff users submit reports and upload evidence for their assigned department.",
    can: [
      "Accept invitations",
      "Access their staff workspace",
      "Submit department reports",
      "Upload evidence",
      "Use form suggestions",
      "Respond to correction requests",
      "Update missing or weak evidence"
    ],
    boundary: "Staff users must not see CEO controls."
  },
  {
    title: "Analyst",
    summary: "Analysts help review assigned businesses and support the control review process.",
    can: [
      "View assigned business queues",
      "Review IC exceptions",
      "Request clarification",
      "Mark issues under review",
      "Escalate unresolved Orange or Red issues",
      "Monitor evidence gaps and report readiness"
    ],
    boundary: "Analysts support review but do not replace CEO ownership."
  },
  {
    title: "Institution User",
    summary: "Institution users can only view approved trust intelligence granted by the CEO.",
    can: [
      "Approved business summaries",
      "VeriScore and IC Score",
      "Evidence confidence",
      "Approved Integrity Reports",
      "Allowed open risk flags"
    ],
    boundary: "Institution users do not see raw department records, raw evidence files, internal notes, or operational dashboards by default."
  }
];

export const onboardingSections: HelpStepSection[] = [
  {
    title: "CEO / Business Owner Onboarding",
    intro: "The CEO sets up the business, invites the right users, reviews control issues, and decides when external trust intelligence can be shared.",
    steps: [
      "Sign up or log in, then go to the CEO dashboard.",
      "Create your business profile by entering the business information requested in the form, such as legal name, trading name, sector, and location. Additional profile details may be requested in later steps as the platform expands.",
      "Complete your business assessment so Fulscann-DB can understand structure, maturity, and readiness.",
      "Review your VeriScore after the assessment is submitted.",
      "Set KPIs for Sales, Finance, Procurement, Operations, HR/Admin, Evidence, and Internal Control.",
      "Create core departments such as Sales, Finance, Procurement, Operations, and HR/Admin.",
      "Invite Staff and Departmental Heads, assigning each user to the correct role and department.",
      "Review reports, evidence gaps, open exceptions, score movement, and department activity.",
      "Resolve exceptions with evidence wherever possible.",
      "Track IC Score movement and share an Integrity Report only after reviewing readiness, risk flags, and evidence confidence."
    ],
    details: [
      "Each KPI should include a name, department, target value, reporting period, unit of measurement, and required evidence where applicable.",
      "Example: Monthly Sales Target of NGN 2,000,000, Department: Sales, Reporting period: Monthly, Evidence: invoices, receipts, inventory records, and finance inflow confirmation.",
      "IC Score may improve when reports are timely, evidence is complete, records match, procurement approvals exist, and exceptions are resolved with evidence."
    ]
  },
  {
    title: "Staff Onboarding",
    intro: "Staff users mainly submit reports, upload evidence, respond to correction requests, and keep assigned records complete.",
    steps: [
      "Accept your invitation.",
      "Access your staff workspace.",
      "Confirm your assigned department.",
      "Submit your department report.",
      "Upload evidence under the right report.",
      "Use suggestions to improve submissions.",
      "Respond to correction requests."
    ],
    details: [
      "Sales examples: sales report, invoice summary, customer sales record.",
      "Finance examples: finance inflow report, expense report, payment confirmation.",
      "Procurement examples: purchase request record, vendor invoice record, delivery confirmation.",
      "Operations examples: production report, order fulfillment report, inventory movement report."
    ]
  },
  {
    title: "Departmental Head Onboarding",
    intro: "The Departmental Head checks whether staff reports are complete, timely, and evidence-backed.",
    steps: [
      "Accept your invitation.",
      "Open your department workspace.",
      "Monitor department compliance.",
      "Request corrections or missing evidence.",
      "Mark department responses ready for CEO or Analyst review.",
      "Escalate unresolved issues to the CEO."
    ],
    details: [
      "Monitor staff report status, missing reports, evidence gaps, department-linked exceptions, correction responses, and department readiness."
    ]
  },
  {
    title: "Analyst Onboarding",
    intro: "Analysts review assigned businesses, request clarification, and escalate unresolved risks without taking over CEO ownership.",
    steps: [
      "Log in to the Analyst dashboard.",
      "Review the assigned business queue.",
      "Review exceptions and IC signals.",
      "Request clarification where evidence or explanation is needed.",
      "Escalate unresolved Orange or Red risks.",
      "Monitor readiness and report status."
    ],
    details: [
      "For each exception, check issue type, risk level, affected department, evidence status, age of the issue, and previous resolution history."
    ]
  },
  {
    title: "Institution User Onboarding",
    intro: "Institution users review approved trust intelligence only. Access is granted by the CEO.",
    steps: [
      "Log in to the Institution workspace.",
      "View approved businesses.",
      "Review approved trust intelligence.",
      "Understand access limits."
    ],
    details: [
      "Institution users may see business profile summaries, VeriScore, IC Score, evidence confidence, approved Integrity Reports, open risk flags, and credit readiness signals.",
      "Institution users must not see raw staff reports, private evidence files, internal dashboard activity, Analyst notes, unapproved business records, or operational records outside approved report access."
    ]
  }
];

export const integrityReportSharing = {
  title: "Integrity Report Sharing",
  body: [
    "The Integrity Report is the external-facing trust report that summarizes a business's readiness, control status, evidence confidence, and risk indicators.",
    "Only the CEO controls when an Integrity Report is shared with an institution. Before granting access, the CEO should review the business profile summary, VeriScore, IC Score, evidence confidence, open risk flags, resolved exceptions, and credit readiness signal.",
    "Institution users only see approved trust intelligence. They do not see raw staff reports, private evidence files, raw operational records, internal dashboard activity, or analyst notes by default.",
    "Analysts may support readiness review, but they do not replace CEO ownership and cannot grant external report access on behalf of the CEO."
  ]
};

export const dashboardSummaries = [
  { title: "CEO Dashboard", items: ["Business profile status", "VeriScore", "IC Score", "Evidence completion", "KPI setup", "Departments", "Staff management", "IC action queue", "Integrity Report sharing", "Institution access"] },
  { title: "Staff Dashboard", items: ["Assigned department", "Submit report", "Upload evidence", "Returned corrections", "Suggestions", "Report history"] },
  { title: "Departmental Head Dashboard", items: ["Department reports", "Department staff", "Evidence gaps", "Correction requests", "Department exceptions", "Compliance queue"] },
  { title: "Analyst Dashboard", items: ["Assigned businesses", "Review queue", "IC exceptions", "Evidence gaps", "Escalations", "Notes"] },
  { title: "Institution Dashboard", items: ["Approved businesses", "Approved reports", "VeriScore", "IC Score", "Evidence confidence", "Risk summaries", "Access history"] }
];

export const kpiGroups = [
  { title: "Sales KPIs", items: ["Monthly Sales Value", "Sales Target Achievement", "Invoice Completion Rate", "Sales-to-Finance Match Rate", "Sales-to-Inventory Match Rate", "Revenue Collection Rate", "Outstanding Receivables", "Sales Exception Rate"] },
  { title: "Finance KPIs", items: ["Monthly Confirmed Inflow", "Sales-to-Inflow Reconciliation Rate", "Expense Documentation Rate", "Cash Variance Rate", "Finance Report Timeliness"] },
  { title: "Procurement KPIs", items: ["Approved Procurement Ratio", "Procurement Approval Completion Rate", "Delivery Confirmation Rate", "Vendor Documentation Rate", "Budget Variance"] },
  { title: "Operations KPIs", items: ["Order Fulfillment Rate", "Production Completion Rate", "Service Delivery Timeliness", "Inventory Movement Accuracy", "Operational Delay Rate"] },
  { title: "HR/Admin KPIs", items: ["Staff Role Coverage", "Department Head Coverage", "Staff Report Timeliness", "Correction Response Time", "Department Compliance Rate"] },
  { title: "Evidence KPIs", items: ["Evidence Completion Rate", "Evidence Quality Score", "Missing Evidence Count", "Cross-Verified Evidence Rate", "Evidence-Backed Resolution Rate"] },
  { title: "Internal Control KPIs", items: ["Open Exception Count", "Red/Orange Exception Count", "Average Resolution Time", "Reopened Exception Rate", "Repeat Issue Rate", "Evidence-Based Closure Rate", "Explanation-Only Closure Rate"] }
];

export const evidenceByDepartment = [
  { title: "Sales", items: ["Invoices", "Receipts", "Customer order records", "Inventory movement records"] },
  { title: "Finance", items: ["Bank statements", "Payment confirmations", "Cashbook records", "Expense receipts"] },
  { title: "Procurement", items: ["Purchase request", "Approval memo", "Supplier invoice", "Delivery note"] },
  { title: "Operations", items: ["Production record", "Order fulfillment log", "Inventory sheet", "Delivery confirmation"] },
  { title: "HR/Admin", items: ["Staff list", "Department assignment", "Attendance record", "Compliance record"] }
];

export const scoreMovement = [
  { title: "Score may improve when", items: ["Required reports are submitted", "Evidence is complete and strong", "Sales and finance records match", "Procurement approvals are available", "Exceptions are resolved with evidence", "Rechecks pass", "Repeated issues reduce"] },
  { title: "Score may not improve much when", items: ["The user only provides explanation without evidence", "Evidence is unclear or incomplete", "The same issue keeps recurring", "The platform cannot verify the correction"] },
  { title: "Score may reduce when", items: ["Reports are missing", "Evidence is weak", "Important figures do not match", "Procurement approval is missing", "A resolved issue fails recheck", "A repeated issue appears again"] }
];

export const trustFlow = [
  "CEO creates business profile.",
  "CEO completes assessment.",
  "Fulscann-DB generates VeriScore.",
  "CEO sets KPIs.",
  "CEO creates departments.",
  "CEO invites Staff and Departmental Heads.",
  "Staff submit department reports.",
  "Staff upload evidence.",
  "IC Engine checks reports and evidence.",
  "Exceptions are created if gaps are found.",
  "CEO, Departmental Head, Staff, or Analyst responds.",
  "Evidence is updated.",
  "IC Engine rechecks the issue.",
  "IC Score is updated.",
  "Integrity Report is prepared.",
  "CEO may share approved trust intelligence with an institution."
];

export const checklistCards: Checklist[] = [
  { title: "For CEOs", items: ["Create account", "Complete business profile", "Complete assessment", "Review VeriScore", "Create key departments", "Set first KPIs", "Invite Staff", "Invite Departmental Heads where needed", "Review dashboard actions"] },
  { title: "For Staff", items: ["Accept invitation", "Confirm assigned department", "Review required reports", "Submit first report", "Upload evidence", "Respond to correction requests"] },
  { title: "For Departmental Heads", items: ["Accept invitation", "Review department dashboard", "Check staff reporting status", "Monitor evidence gaps", "Request corrections where needed", "Mark department responses ready"] },
  { title: "For Analysts", items: ["Review assigned businesses", "Open IC review queue", "Check high-risk exceptions", "Request clarification where needed", "Escalate unresolved issues"] },
  { title: "For Institutions", items: ["Log in", "Review approved businesses", "Open approved reports", "Check VeriScore, IC Score, and evidence confidence", "Respect approved access boundaries"] }
];

export const faqs = [
  { question: "Do I need to complete everything on the first day?", answer: "No. Start with your business profile, assessment, KPIs, departments, and key users. You can continue improving your records over time." },
  { question: "Can staff see CEO controls?", answer: "No. Staff users only see tools and records relevant to their role and department." },
  { question: "Can institutions see my raw evidence?", answer: "No. Institutions do not see raw evidence by default. They only see approved trust intelligence granted by the CEO." },
  { question: "What happens if I upload new evidence?", answer: "New evidence may trigger an IC workflow recheck. If the evidence resolves a gap, the score or exception status may improve." },
  { question: "What happens if I only provide an explanation?", answer: "An explanation may provide context, but it may not improve score confidence as much as strong evidence." },
  { question: "Who can resolve exceptions?", answer: "The CEO owns final business-level resolution. Departmental Heads and Staff may support the process by providing corrections, evidence, and department responses." },
  { question: "What if the same issue happens again?", answer: "Repeated issues may reduce confidence because they show a recurring control weakness." }
];
