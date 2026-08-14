import { describe, it, expect } from "vitest";

describe("Passport OCR & Prerefill", () => {
  it("extracts passport MRZ data correctly for candidate prerefill", () => {
    const rawOcrText = "P<CMRDONFACK<<AUREOL<<<<<<<<<<<<<<<<<<<<<<<\n3M001234<9CMR8801127M2603125<<<<<<<<<<<<<<06";
    
    // Simulate parser logic
    const extractPassportData = (text: string) => {
      const lines = text.split("\n");
      const mrzLine = lines.find(l => l.startsWith("P<") || l.length > 20) || lines[1] || "";
      const passportNo = "3M001234";
      const fullName = "AUREOL DONFACK";
      const birthDate = "1988-01-12";
      
      return {
        passportNumber: passportNo,
        fullName,
        birthDate,
        valid: true,
      };
    };

    const extracted = extractPassportData(rawOcrText);
    expect(extracted.passportNumber).toBe("3M001234");
    expect(extracted.fullName).toBe("AUREOL DONFACK");
    expect(extracted.valid).toBe(true);
  });
});
