// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import SignatureCanvas from "@/components/SignatureCanvas";

describe("SignatureCanvas — trait rapide", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        clearRect: vi.fn(),
      }),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: () => "data:image/png;base64,test-signature",
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 500, height: 160, right: 500, bottom: 160 }),
    });
  });

  it("publie la signature dès un trait Pointer rapide", () => {
    const onSignatureChange = vi.fn();
    const { container } = render(<SignatureCanvas onSignatureChange={onSignatureChange} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    fireEvent.pointerDown(canvas!, { pointerId: 1, clientX: 20, clientY: 30 });
    fireEvent.pointerMove(canvas!, { pointerId: 1, clientX: 80, clientY: 45 });
    fireEvent.pointerUp(canvas!, { pointerId: 1, clientX: 80, clientY: 45 });

    expect(onSignatureChange).toHaveBeenCalledWith("data:image/png;base64,test-signature");
  });

  it("publie aussi un trait Pointer rapide sur un second pointeur", () => {
    const onSignatureChange = vi.fn();
    const { container } = render(<SignatureCanvas onSignatureChange={onSignatureChange} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    fireEvent.pointerDown(canvas!, { pointerId: 7, clientX: 20, clientY: 30 });
    fireEvent.pointerMove(canvas!, { pointerId: 7, clientX: 80, clientY: 45 });
    fireEvent.pointerUp(canvas!, { pointerId: 7, clientX: 80, clientY: 45 });

    expect(onSignatureChange).toHaveBeenCalledWith("data:image/png;base64,test-signature");
  });
});
