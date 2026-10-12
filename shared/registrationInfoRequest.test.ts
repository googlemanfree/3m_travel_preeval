import { describe, expect, it } from "vitest";
import {
  buildRegistrationInfoRequest,
  registrationInfoRequestEmailHtml,
  registrationProfileDownloadText,
} from "./registrationInfoRequest";

describe("registrationInfoRequest", () => {
  it("exige le CV pour un visa travail sans CV", () => {
    const request = buildRegistrationInfoRequest({
      destination: "Luxembourg",
      visaType: "Travail",
      hasCv: false,
    });
    expect(request.items.some((item) => /cv/i.test(item.label) && item.priority === "required")).toBe(true);
    expect(request.subject).toContain("Luxembourg");
  });

  it("construit une checklist études sans imposer le CV", () => {
    const request = buildRegistrationInfoRequest({
      destination: "Canada",
      visaType: "Études",
      hasCv: false,
    });
    expect(request.projectKind).toBe("etudes");
    expect(request.items.length).toBeGreaterThan(0);
    expect(request.items.some((item) => /cv/i.test(item.label) && item.priority === "required")).toBe(false);
  });

  it("produit un e-mail et un export téléchargeable lisibles", () => {
    const request = buildRegistrationInfoRequest({ destination: "France", visaType: "Tourisme", hasCv: true });
    const html = registrationInfoRequestEmailHtml({
      fullName: "Jean Test",
      destination: request.destination,
      visaType: request.visaType,
      items: request.items,
    });
    expect(html).toContain("Jean Test");
    expect(html).toContain("France");
    const text = registrationProfileDownloadText({
      fullName: "Jean Test",
      email: "jean@example.com",
      preferredDestinations: ["France"],
      visaType: "Tourisme",
      nationality: "Camerounaise",
    });
    expect(text).toContain("Jean Test");
    expect(text).toContain("France (principale)");
    expect(text).toContain("Tourisme");
  });
});
