/**
 * Volume enforcer script - runs in the MAIN world at document_start.
 * Scales HTMLMediaElement volume by a factor instead of enforcing an absolute
 * value, so page-side volume controls (YouTube, Twitch, etc.) continue to work.
 */
(() => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'volume'
  );
  if (!originalDescriptor) return;

  // Scale factor (0.0-1.0). 1.0 = pass-through (no change).
  let scale: number = 1.0;

  // Per-element volume as the page intends it, so the getter returns what the
  // page expects rather than the scaled actual value.
  const intendedVolumes = new WeakMap<HTMLMediaElement, number>();

  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    get() {
      if (intendedVolumes.has(this)) {
        return intendedVolumes.get(this)!;
      }
      return originalDescriptor.get!.call(this);
    },
    set(value: number) {
      const clamped = Math.max(0, Math.min(1, value));
      intendedVolumes.set(this, clamped);
      originalDescriptor.set!.call(this, clamped * scale);
    },
    configurable: true,
    enumerable: true,
  });

  // Receive scale factor from content script (isolated world) via CustomEvent
  window.addEventListener('__dvc_set_volume', ((event: CustomEvent) => {
    const vol = event.detail?.volume;
    if (typeof vol !== 'number') return;

    scale = Math.max(0, Math.min(1, vol / 100));

    // Reapply scaling to all existing media elements
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(el => {
      // Use the stored intended volume, or the current actual volume as baseline
      const intended = intendedVolumes.has(el)
        ? intendedVolumes.get(el)!
        : originalDescriptor.get!.call(el);
      intendedVolumes.set(el, intended);
      originalDescriptor.set!.call(el, intended * scale);
    });
  }) as EventListener);
})();
