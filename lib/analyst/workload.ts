import type { Analyst, AnalystAssignment, AnalystWorkload, Business } from "@/lib/types";

export const ANALYST_BUSINESS_CAPACITY = 15;

export function getAnalystWorkloads(
  analysts: Analyst[],
  assignments: AnalystAssignment[],
  capacity = ANALYST_BUSINESS_CAPACITY
): AnalystWorkload[] {
  return analysts.map((analyst) => {
    const assignedCount = assignments.filter(
      (assignment) => assignment.analystId === analyst.id && assignment.status === "active"
    ).length;

    return {
      analyst,
      assignedCount,
      capacity,
      availableSlots: Math.max(capacity - assignedCount, 0),
      utilization: Math.round((assignedCount / capacity) * 100),
      overloaded: assignedCount > capacity
    };
  });
}

export function canAssignBusinessToAnalyst(
  analystId: string,
  assignments: AnalystAssignment[],
  capacity = ANALYST_BUSINESS_CAPACITY
) {
  const activeAssignments = assignments.filter(
    (assignment) => assignment.analystId === analystId && assignment.status === "active"
  );

  return activeAssignments.length < capacity;
}

export function getUnassignedBusinesses(businesses: Business[], assignments: AnalystAssignment[]) {
  const assignedBusinessIds = new Set(
    assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => assignment.businessId)
  );

  return businesses.filter((business) => !assignedBusinessIds.has(business.id));
}

export function getAssignableAnalysts(
  analysts: Analyst[],
  assignments: AnalystAssignment[],
  capacity = ANALYST_BUSINESS_CAPACITY
) {
  return analysts.filter((analyst) => canAssignBusinessToAnalyst(analyst.id, assignments, capacity));
}
