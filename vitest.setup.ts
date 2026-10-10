class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!(globalThis as any).IntersectionObserver) (globalThis as any).IntersectionObserver = NoopIntersectionObserver;
if (!(globalThis as any).ResizeObserver) (globalThis as any).ResizeObserver = NoopResizeObserver;
if (!(globalThis as any).matchMedia) {
  (globalThis as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollIntoView ??= () => undefined;
  HTMLElement.prototype.hasPointerCapture ??= () => false;
  HTMLElement.prototype.setPointerCapture ??= () => undefined;
  HTMLElement.prototype.releasePointerCapture ??= () => undefined;
}
