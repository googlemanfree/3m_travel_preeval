// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
(globalThis as any).React = React;
import AdminTodayDashboard, { buildTodayItems, type TodayCandidate } from "@/components/AdminTodayDashboard";

afterEach(cleanup);
const candidates: TodayCandidate[] = [
  { id: "online_1", fullName: "Aïcha Nkolo", folderCode: "3M-001", destinationCountry: "Canada", journeySla: { tone: "overdue", label: "SLA dépassé · Documents" }, paymentStatus: "SUCCESS", agreementSigned: false, checklistPercent: 60, siblingCount: 2 },
  { id: "online_2", fullName: "Jean Mvondo", folderCode: "3M-002", destinationCountry: "France", journeySla: { tone: "soon" }, secondProtocolReady: true, secondProtocolSigned: false },
];

describe("tableau admin Aujourd’hui", () => {
  it("agrège SLA, protocoles, checklist et procédures liées", () => {
    const items = buildTodayItems(candidates);
    expect(items.map((item) => item.label)).toEqual(expect.arrayContaining(["SLA dépassé", "Protocole N°01 à signer", "Checklist sous 80 %", "Traitement simultané multi-procédures", "SLA sous 24 h", "Protocole N°02 à signer"]));
  });
  it("expose une actualisation manuelle et ouvre la fiche concernée", () => {
    const refresh = vi.fn();
    const open = vi.fn();
    render(<AdminTodayDashboard candidates={candidates} isRefreshing={false} lastUpdatedAt={new Date("2026-10-09T12:00:00Z")} onRefresh={refresh} onOpen={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));
    fireEvent.click(screen.getAllByTestId("today-priority-item")[0]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("online_1");
    expect(screen.getByTestId("today-last-updated").textContent).toContain("Dernière actualisation");
  });
  it("n’ajoute aucun intervalle de polling dans le composant", () => {
    const source = require("node:fs").readFileSync("client/src/components/AdminTodayDashboard.tsx", "utf8");
    expect(source).not.toContain("refetchInterval");
    expect(source).not.toContain("setInterval");
  });
});
