import '@testing-library/jest-dom'

// jsdom lacks IntersectionObserver, which framer-motion's whileInView uses.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
if (!('IntersectionObserver' in globalThis)) {
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver
}

// jsdom provides its own AbortController/AbortSignal (DOM globals), while the
// Request/fetch globals come from Node's built-in undici. react-router's data
// router builds `new Request(url, { signal })` on every client-side navigation
// (react-router/lib/router.ts createClientSideRequest), and undici's internal
// brand check rejects a signal from jsdom's AbortSignal class, throwing
// "RequestInit: Expected signal to be an instance of AbortSignal" and silently
// aborting the navigation. We have no loaders/actions that read the signal, so
// drop it before delegating to the real Request constructor.
if (typeof globalThis.Request !== 'undefined') {
  const OriginalRequest = globalThis.Request
  class PatchedRequest extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const { signal: _signal, ...rest } = init ?? {}
      super(input, rest)
    }
  }
  globalThis.Request = PatchedRequest as unknown as typeof Request
}

// jsdom's Blob/File lack .text()/.arrayBuffer() (standard in real browsers).
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function () {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(r.error)
      r.readAsText(this as unknown as Blob)
    })
  }
  Blob.prototype.arrayBuffer = function () {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as ArrayBuffer)
      r.onerror = () => reject(r.error)
      r.readAsArrayBuffer(this as unknown as Blob)
    })
  }
}
