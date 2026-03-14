/**
 * Volume enforcer script - runs in the MAIN world at document_start.
 * Overrides HTMLMediaElement.prototype.volume setter to prevent
 * page JavaScript from overriding our saved volume setting.
 */
(() => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'volume'
  );
  if (!originalDescriptor) return;

  // Target volume (0.0-1.0), null means don't enforce
  let targetVolume: number | null = null;

  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    get() {
      return originalDescriptor.get!.call(this);
    },
    set(value: number) {
      if (targetVolume !== null) {
        // Enforce our target volume, ignoring what the page wants to set
        originalDescriptor.set!.call(this, targetVolume);
      } else {
        originalDescriptor.set!.call(this, value);
      }
    },
    configurable: true,
    enumerable: true,
  });

  // Receive target volume from content script (isolated world) via CustomEvent
  window.addEventListener('__dvc_set_volume', ((event: CustomEvent) => {
    const vol = event.detail?.volume;
    if (typeof vol !== 'number') return;

    targetVolume = Math.max(0, Math.min(1, vol / 100));

    // Apply to all existing media elements immediately
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(el => {
      originalDescriptor.set!.call(el, targetVolume!);
    });
  }) as EventListener);
})();
