import type { Metadata } from "next";
import { ChecklistCard } from "@/components/help/ChecklistCard";
import { FaqAccordion } from "@/components/help/FaqAccordion";
import { HelpSection } from "@/components/help/HelpSection";
import { RoleCard } from "@/components/help/RoleCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  checklistCards,
  dashboardSummaries,
  evidenceByDepartment,
  faqs,
  keyTerms,
  kpiGroups,
  onboardingSections,
  platformActions,
  platformQuestions,
  roles,
  scoreMovement,
  trustFlow
} from "@/lib/help/getting-started-content";

export const metadata: Metadata = {
  title: "Getting Started with Fulscann-DB",
  description: "A Help Center guide for new Fulscann-DB users."
};

const sectionLinks = [
  ["Welcome", "#welcome"],
  ["Roles", "#roles"],
  ["Onboarding", "#onboarding"],
  ["Dashboards", "#dashboards"],
  ["KPIs", "#kpis"],
  ["Evidence", "#evidence"],
  ["Exceptions", "#exceptions"],
  ["Scores", "#score-movement"],
  ["Checklist", "#checklist"],
  ["FAQ", "#faq"]
] as const;

export default function GettingStartedHelpPage() {
  return (
    <div className="help-page">
      <aside className="help-nav" aria-label="Getting started sections">
        <strong>Getting Started</strong>
        {sectionLinks.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
      </aside>

      <article className="help-article">
        <section className="help-hero" id="welcome">
          <StatusBadge label="Help Center" tone="info" />
          <h1>Getting Started with Fulscann-DB</h1>
          <p>
            Fulscann-DB helps SMEs organize business structure, track performance, submit evidence, detect internal
            control gaps, and build trust intelligence that can be shared with approved institutions.
          </p>
          <div className="help-cta-row">
            <ActionButton href="/dashboard/ceo" variant="primary">Go to CEO Dashboard</ActionButton>
            <ActionButton href="/dashboard/ceo/onboarding">Set Up KPIs</ActionButton>
            <ActionButton href="/dashboard/staff">Submit a Report</ActionButton>
            <ActionButton href="/institution">View Approved Reports</ActionButton>
          </div>
        </section>

        <HelpSection
          id="what-fulscann-does"
          title="What Fulscann-DB Does"
          intro="Fulscann-DB does not simply collect business information. It checks business claims against reports, evidence, internal control rules, exceptions, and score movement."
        >
          <div className="help-grid two">
            <div className="help-card">
              <h3>Fulscann-DB helps businesses answer</h3>
              <ul>{platformQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="help-card">
              <h3>What users can do</h3>
              <ul>{platformActions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </HelpSection>

        <HelpSection id="terms" title="Key Platform Terms" intro="These terms appear throughout the dashboards and reports.">
          <div className="help-grid three">
            {keyTerms.map((term) => (
              <article className="help-card" key={term.title}>
                <h3>{term.title}</h3>
                <p>{term.body}</p>
                {term.examples ? <ul>{term.examples.map((example) => <li key={example}>{example}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="roles" title="Understanding User Roles" intro="Each role sees tools and information that match its responsibility. Super Admin onboarding is not included in this guide.">
          <div className="help-grid two">
            {roles.map((role) => <RoleCard key={role.title} role={role} />)}
          </div>
        </HelpSection>

        <HelpSection id="onboarding" title="Role Onboarding" intro="Start with the steps for your role, then return to the dashboard to continue building readiness over time.">
          <div className="step-list">
            {onboardingSections.map((section) => (
              <section className="help-card step-card" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.intro}</p>
                <ol>
                  {section.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {section.details ? <ul>{section.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
              </section>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="dashboards" title="Navigating the Dashboard" intro="Each dashboard is organized around the main question that role needs to answer.">
          <div className="help-grid two">
            {dashboardSummaries.map((dashboard) => (
              <article className="help-card" key={dashboard.title}>
                <h3>{dashboard.title}</h3>
                <ul>{dashboard.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection
          id="kpis"
          title="Understanding KPIs"
          intro="KPIs are not just ordinary targets. They connect business goals to reports, evidence, IC validation, exceptions, score movement, and institution confidence."
        >
          <div className="help-card emphasis-card">
            <h3>Each KPI should have</h3>
            <ul>
              <li>KPI name</li>
              <li>Department</li>
              <li>Owner or responsible role</li>
              <li>Target value</li>
              <li>Reporting period</li>
              <li>Evidence requirement</li>
              <li>IC rule association, risk threshold, and score/report impact where applicable</li>
            </ul>
          </div>
          <div className="help-grid three">
            {kpiGroups.map((group) => (
              <article className="help-card" key={group.title}>
                <h3>{group.title}</h3>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="suggestions" title="Understanding Suggestions" intro="Fulscann-DB includes a Suggestion Engine to help users complete forms and submit better records.">
          <div className="help-card">
            <p>Suggestions may appear when creating a business profile, setting up KPIs, creating departments, inviting staff, submitting reports, uploading evidence, resolving exceptions, and reviewing issues.</p>
            <ul>
              <li>Add Finance as a department to support Sales-Finance matching.</li>
              <li>Upload invoices to support this sales report.</li>
              <li>Add bank inflow evidence for this finance report.</li>
              <li>This procurement record may require approval evidence.</li>
              <li>Your resolution note should explain the issue, evidence added, and corrective action.</li>
            </ul>
          </div>
        </HelpSection>

        <HelpSection id="evidence" title="Understanding Evidence Uploads" intro="Evidence gives strength to business claims. Strong evidence should be relevant, readable, correctly linked, consistent with other records, and complete enough to support the claim.">
          <div className="help-grid three">
            {evidenceByDepartment.map((department) => (
              <article className="help-card" key={department.title}>
                <h3>{department.title}</h3>
                <ul>{department.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="exceptions" title="Understanding Exceptions" intro="Exceptions are issues detected by Fulscann-DB. They do not always mean fraud or wrongdoing. They mean something needs review, correction, evidence, or explanation.">
          <div className="help-grid two">
            <article className="help-card">
              <h3>Common exceptions</h3>
              <ul>
                <li>Missing department report</li>
                <li>Weak evidence</li>
                <li>Missing invoice or bank confirmation</li>
                <li>Sales-Finance mismatch</li>
                <li>Procurement approval gap</li>
                <li>Missing delivery confirmation</li>
                <li>Repeated unresolved issue</li>
              </ul>
            </article>
            <article className="help-card">
              <h3>Risk levels</h3>
              <ul>
                <li><strong>Green:</strong> no major issue or low concern.</li>
                <li><strong>Yellow:</strong> minor issue or early warning.</li>
                <li><strong>Orange:</strong> important issue requiring attention.</li>
                <li><strong>Red:</strong> serious issue requiring urgent review.</li>
              </ul>
            </article>
          </div>
          <div className="help-card">
            <h3>What to do when you see an exception</h3>
            <ol>
              <li>Open the exception.</li>
              <li>Read the issue description.</li>
              <li>Check the affected department.</li>
              <li>Review the required action.</li>
              <li>Upload missing evidence if needed.</li>
              <li>Add clarification if required.</li>
              <li>Submit for review.</li>
              <li>Wait for recheck or approval.</li>
            </ol>
          </div>
        </HelpSection>

        <HelpSection id="score-movement" title="Understanding Score Movement" intro="Fulscann-DB uses reports, evidence, exceptions, and lifecycle behavior to support IC Score movement.">
          <div className="help-grid three">
            {scoreMovement.map((group) => (
              <article className="help-card" key={group.title}>
                <h3>{group.title}</h3>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </HelpSection>

        <HelpSection id="flow" title="Walkthrough: From KPI to Trust Intelligence">
          <div className="help-card">
            <ol className="flow-list">{trustFlow.map((item) => <li key={item}>{item}</li>)}</ol>
          </div>
        </HelpSection>

        <HelpSection id="example" title="Example: Sales-Finance Mismatch" intro="A practical example of how Fulscann-DB turns reports and evidence into reviewable trust intelligence.">
          <div className="help-card example-card">
            <p>A Sales staff member reports monthly sales of NGN 2,000,000 and uploads invoices. Finance later confirms finance inflow of NGN 1,200,000.</p>
            <p>Fulscann-DB detects a difference of NGN 800,000 and may create a Sales-Finance mismatch exception.</p>
            <ul>
              <li>Sales uploads missing invoice or receipt evidence.</li>
              <li>Finance confirms delayed payment or pending receivable.</li>
              <li>Departmental Heads review the gap.</li>
              <li>CEO reviews the response.</li>
              <li>Analyst may request clarification if assigned.</li>
              <li>IC Engine rechecks after evidence or explanation is submitted.</li>
              <li>IC Score is adjusted based on the result.</li>
            </ul>
          </div>
        </HelpSection>

        <HelpSection id="best-practices" title="Best Practices for New Users">
          <div className="help-card">
            <ul className="best-practice-list">
              <li>Complete your profile carefully.</li>
              <li>Start with the most important KPIs.</li>
              <li>Use clear departments.</li>
              <li>Invite the right users.</li>
              <li>Upload evidence early.</li>
              <li>Treat exceptions as improvement signals.</li>
              <li>Use suggestions.</li>
              <li>Resolve issues with evidence.</li>
              <li>Review your dashboard regularly.</li>
              <li>Control institution access carefully.</li>
            </ul>
          </div>
        </HelpSection>

        <HelpSection id="checklist" title="Recommended First-Day Checklist" intro="Use the checklist for your role to make the first day focused and manageable.">
          <div className="help-grid three">
            {checklistCards.map((checklist) => <ChecklistCard checklist={checklist} key={checklist.title} />)}
          </div>
        </HelpSection>

        <HelpSection id="faq" title="Common Questions">
          <FaqAccordion faqs={faqs} />
        </HelpSection>
      </article>
    </div>
  );
}
