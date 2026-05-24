"use client";

import { useMemo, useState } from "react";
import type { DefaultBusinessKpi } from "@/lib/kpis/default-kpis";
import type { Department } from "@/lib/types";

type KpiSelectorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  businessId?: string;
  departments: Department[];
  defaultKpis: DefaultBusinessKpi[];
};

export function KpiSelectorForm({ action, businessId, departments, defaultKpis }: KpiSelectorFormProps) {
  const salesDepartment = departments.find((department) => department.departmentType === "sales");
  const [selectedKpiKey, setSelectedKpiKey] = useState(defaultKpis[0]?.key ?? "custom");
  const selectedKpi = useMemo(
    () => defaultKpis.find((kpi) => kpi.key === selectedKpiKey) ?? null,
    [defaultKpis, selectedKpiKey]
  );
  const customSelected = selectedKpiKey === "custom";
  const departmentOptions = customSelected ? departments : departments.filter((department) => department.departmentType === selectedKpi?.departmentSlug);
  const selectedDepartmentId = customSelected ? salesDepartment?.id ?? departments[0]?.id : salesDepartment?.id;

  return (
    <form action={action} className="form">
      <input type="hidden" name="businessId" value={businessId ?? ""} />
      <label>
        KPI
        <select name="selectedKpiKey" required value={selectedKpiKey} onChange={(event) => setSelectedKpiKey(event.target.value)}>
          {defaultKpis.map((kpi) => (
            <option key={kpi.key} value={kpi.key}>
              {kpi.name}
            </option>
          ))}
          <option value="custom">Add custom KPI</option>
        </select>
      </label>

      <label>
        Department
        <select name="departmentId" required defaultValue={selectedDepartmentId ?? ""} disabled={departmentOptions.length === 0}>
          <option value="">Select department</option>
          {departmentOptions.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      {customSelected ? (
        <label>
          Custom KPI name
          <input name="customName" minLength={2} maxLength={160} placeholder="Customer Retention Rate" />
        </label>
      ) : (
        <p>{selectedKpi?.description}</p>
      )}

      <label>
        Target value
        <input name="targetValue" type="number" min="0" step="0.01" placeholder={selectedKpi?.unit === "NGN" ? "2500000" : "95"} />
      </label>

      <label>
        Unit
        <input key={`unit-${selectedKpiKey}`} name="unit" required minLength={1} maxLength={40} defaultValue={selectedKpi?.unit ?? ""} placeholder={customSelected ? "%" : undefined} />
      </label>

      <label>
        Frequency
        <select key={`frequency-${selectedKpiKey}`} name="defaultFrequency" required defaultValue={selectedKpi?.defaultFrequency ?? "monthly"}>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
      </label>

      {!customSelected && selectedKpi ? (
        <div>
          <strong>Evidence</strong>
          <p>{selectedKpi.evidenceRequirements.join(", ")}</p>
          <strong>IC links</strong>
          <p>{selectedKpi.icRuleLinks.join(", ")}</p>
        </div>
      ) : null}

      <button className="button primary" type="submit" disabled={!businessId || departments.length === 0}>
        Add KPI
      </button>
    </form>
  );
}
