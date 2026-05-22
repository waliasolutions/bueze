import { describe, it, expect } from "vitest";
import { getLeadDisplayStatus, LEAD_STATUS_IN_PROGRESS, LEAD_STATUSES } from "./leadStatuses";

describe("getLeadDisplayStatus", () => {
  it("completed + accepted_proposal_id + no delivered_at => 'In Bearbeitung'", () => {
    const r = getLeadDisplayStatus({
      status: "completed",
      accepted_proposal_id: "prop-1",
      delivered_at: null,
    });
    expect(r.label).toBe(LEAD_STATUS_IN_PROGRESS.label);
    expect(r.label).toBe("In Bearbeitung");
  });

  it("completed + accepted_proposal_id + delivered_at => 'Erledigt'", () => {
    const r = getLeadDisplayStatus({
      status: "completed",
      accepted_proposal_id: "prop-1",
      delivered_at: "2026-05-22T10:00:00Z",
    });
    expect(r.label).toBe("Erledigt");
    expect(r.label).toBe(LEAD_STATUSES.completed.label);
  });

  it("completed without accepted_proposal_id (manual) => 'Erledigt'", () => {
    const r = getLeadDisplayStatus({
      status: "completed",
      accepted_proposal_id: null,
      delivered_at: null,
    });
    expect(r.label).toBe("Erledigt");
  });

  it("completed + undefined delivered_at + accepted => 'In Bearbeitung'", () => {
    const r = getLeadDisplayStatus({
      status: "completed",
      accepted_proposal_id: "prop-x",
    });
    expect(r.label).toBe("In Bearbeitung");
  });

  it("active => 'Aktiv'", () => {
    expect(getLeadDisplayStatus({ status: "active" }).label).toBe("Aktiv");
  });

  it("expired => 'Abgelaufen' (no silent draft fallback)", () => {
    expect(getLeadDisplayStatus({ status: "expired" }).label).toBe("Abgelaufen");
  });

  it("unknown status => neutral outline, never 'Entwurf'", () => {
    const r = getLeadDisplayStatus({ status: "something_new" });
    expect(r.variant).toBe("outline");
    expect(r.label).not.toBe("Entwurf");
  });
});
