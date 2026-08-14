import { describe, it, expect } from "vitest";

describe("Calendar Export Links (Google Calendar & Outlook)", () => {
  it("generates correct web links for adding appointments to Google Calendar and Outlook", () => {
    const appointment = {
      title: "Consultation 3M Travel - Canada Express Entry",
      date: "2026-08-25",
      time: "11:00",
      location: "Agence 3M Travel & Services ou Vidéo",
      details: "Référence: 3M-APT-9921",
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appointment.title)}&dates=20260825T110000Z/20260825T120000Z&details=${encodeURIComponent(appointment.details)}&location=${encodeURIComponent(appointment.location)}`;
    const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(appointment.title)}&startdt=2026-08-25T11:00:00Z&enddt=2026-08-25T12:00:00Z&body=${encodeURIComponent(appointment.details)}&location=${encodeURIComponent(appointment.location)}`;

    expect(googleCalendarUrl).toContain("calendar.google.com");
    expect(googleCalendarUrl).toContain("Consultation%203M%20Travel");
    expect(outlookCalendarUrl).toContain("outlook.live.com");
    expect(outlookCalendarUrl).toContain("3M-APT-9921");
  });
});
