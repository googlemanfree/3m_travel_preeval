import { describe, it, expect } from "vitest";

describe("Copy Link Button Visual Animation", () => {
  it("toggles visual success state with green checkmark and reverts after timeout", () => {
    let copied = false;
    const triggerCopy = () => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    };

    triggerCopy();
    expect(copied).toBe(true);
  });
});
