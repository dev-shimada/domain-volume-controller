/**
 * Volume enforcer script - runs in the MAIN world at document_start.
 * Scales audio output by a factor instead of enforcing an absolute value,
 * so page-side volume controls (YouTube, Twitch, etc.) continue to work.
 *
 * Covered outputs:
 * - HTMLMediaElement (audio/video), including elements inside shadow DOM
 *   and elements never attached to the DOM (e.g. `new Audio()`)
 * - Web Audio API: a GainNode is interposed in front of every
 *   AudioContext.destination connection
 */
(() => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'volume'
  );
  if (!originalDescriptor?.get || !originalDescriptor.set) return;
  const originalGet = originalDescriptor.get;
  const originalSet = originalDescriptor.set;

  // Scale factor (0.0-1.0). 1.0 = pass-through (no change).
  let scale: number = 1.0;

  // Per-element volume as the page intends it, so the getter returns what the
  // page expects rather than the scaled actual value.
  const intendedVolumes = new WeakMap<HTMLMediaElement, number>();

  // Elements routed into a Web Audio graph via createMediaElementSource.
  // Their output passes through the per-context gain node, so the element
  // itself must not be scaled again (it would apply scale twice).
  const webAudioRouted = new WeakSet<HTMLMediaElement>();

  // Every media element we have ever seen, so scale changes reach elements
  // that querySelectorAll cannot find (detached elements, `new Audio()`).
  const trackedRefs = new Set<WeakRef<HTMLMediaElement>>();
  const tracked = new WeakSet<HTMLMediaElement>();

  // Shadow roots (open and closed), so scale changes reach media elements
  // rendered inside web components.
  const shadowRootRefs = new Set<WeakRef<ShadowRoot>>();

  // Gain nodes interposed before each AudioContext destination.
  const contextGains = new WeakMap<BaseAudioContext, GainNode>();
  const gainRefs = new Set<WeakRef<GainNode>>();

  function track(el: HTMLMediaElement): void {
    if (!tracked.has(el)) {
      tracked.add(el);
      trackedRefs.add(new WeakRef(el));
    }
  }

  function applyScale(el: HTMLMediaElement): void {
    const intended = intendedVolumes.has(el)
      ? intendedVolumes.get(el)!
      : originalGet.call(el);
    intendedVolumes.set(el, intended);
    const factor = webAudioRouted.has(el) ? 1 : scale;
    originalSet.call(el, intended * factor);
  }

  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    get() {
      if (intendedVolumes.has(this)) {
        return intendedVolumes.get(this)!;
      }
      return originalGet.call(this);
    },
    set(value: number) {
      const clamped = Math.max(0, Math.min(1, value));
      track(this);
      intendedVolumes.set(this, clamped);
      const factor = webAudioRouted.has(this) ? 1 : scale;
      originalSet.call(this, clamped * factor);
    },
    configurable: true,
    enumerable: true,
  });

  // Hook play() so elements the page never sets a volume on (default 1.0,
  // detached, or inside shadow DOM) are still tracked and scaled.
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (
    this: HTMLMediaElement
  ): Promise<void> {
    track(this);
    applyScale(this);
    return originalPlay.call(this);
  };

  // Record shadow roots (works for closed roots too) so reapplyAll can reach
  // media elements inside them.
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (
    this: Element,
    init: ShadowRootInit
  ): ShadowRoot {
    const root = originalAttachShadow.call(this, init);
    shadowRootRefs.add(new WeakRef(root));
    return root;
  };

  /**
   * Web Audio API: interpose a GainNode between any node and
   * AudioContext.destination. OfflineAudioContext renders to a buffer, not
   * the speakers, so it is deliberately left untouched.
   */
  function setupWebAudioScaling(): void {
    const originalConnect = AudioNode.prototype.connect as (
      this: AudioNode,
      destination: AudioNode | AudioParam,
      output?: number,
      input?: number
    ) => AudioNode | void;
    const originalDisconnect = AudioNode.prototype.disconnect as (
      this: AudioNode,
      ...args: unknown[]
    ) => void;

    function getContextGain(ctx: BaseAudioContext): GainNode {
      let gain = contextGains.get(ctx);
      if (!gain) {
        gain = ctx.createGain();
        gain.gain.value = scale;
        originalConnect.call(gain, ctx.destination);
        contextGains.set(ctx, gain);
        gainRefs.add(new WeakRef(gain));
      }
      return gain;
    }

    function isScalableDestination(node: unknown, ctx: BaseAudioContext): boolean {
      return (
        typeof AudioDestinationNode !== 'undefined' &&
        node instanceof AudioDestinationNode &&
        node === ctx.destination &&
        !(typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext)
      );
    }

    AudioNode.prototype.connect = function (
      this: AudioNode,
      destination: AudioNode | AudioParam,
      output?: number,
      input?: number
    ): AudioNode | void {
      if (isScalableDestination(destination, this.context)) {
        const gain = getContextGain(this.context);
        if (output !== undefined) {
          originalConnect.call(this, gain, output, 0);
        } else {
          originalConnect.call(this, gain);
        }
        // Per spec, connect(AudioNode) returns the destination node.
        return destination as AudioNode;
      }
      if (input !== undefined) {
        return originalConnect.call(this, destination, output, input);
      }
      if (output !== undefined) {
        return originalConnect.call(this, destination, output);
      }
      return originalConnect.call(this, destination);
    } as typeof AudioNode.prototype.connect;

    AudioNode.prototype.disconnect = function (
      this: AudioNode,
      ...args: unknown[]
    ): void {
      // The page thinks it is connected to ctx.destination, but it is actually
      // connected to our gain node — remap so disconnect(destination) works.
      if (args.length > 0 && isScalableDestination(args[0], this.context)) {
        const gain = contextGains.get(this.context);
        if (gain) {
          try {
            return originalDisconnect.call(this, gain, ...args.slice(1));
          } catch {
            // Fall through: the node may genuinely be connected to the
            // destination directly (connected before this script ran).
          }
        }
      }
      return originalDisconnect.apply(this, args);
    };

    // When a media element is routed into a Web Audio graph, its output goes
    // through the per-context gain node; undo element-level scaling to avoid
    // applying the scale twice.
    const originalCreateMediaElementSource =
      AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function (
      this: AudioContext,
      element: HTMLMediaElement
    ): MediaElementAudioSourceNode {
      const source = originalCreateMediaElementSource.call(this, element);
      webAudioRouted.add(element);
      track(element);
      applyScale(element);
      return source;
    };
  }

  if (typeof AudioNode !== 'undefined' && typeof AudioContext !== 'undefined') {
    setupWebAudioScaling();
  }

  function reapplyAll(): void {
    // Web Audio gain nodes
    for (const ref of gainRefs) {
      const gain = ref.deref();
      if (!gain) {
        gainRefs.delete(ref);
        continue;
      }
      gain.gain.value = scale;
    }

    // Media elements in the light DOM and in shadow roots
    document
      .querySelectorAll<HTMLMediaElement>('audio, video')
      .forEach(track);
    for (const ref of shadowRootRefs) {
      const root = ref.deref();
      if (!root) {
        shadowRootRefs.delete(ref);
        continue;
      }
      root.querySelectorAll<HTMLMediaElement>('audio, video').forEach(track);
    }

    // Everything we have ever seen (includes detached elements)
    for (const ref of trackedRefs) {
      const el = ref.deref();
      if (!el) {
        trackedRefs.delete(ref);
        continue;
      }
      applyScale(el);
    }
  }

  // Receive scale factor from content script (isolated world) via CustomEvent
  window.addEventListener('__dvc_set_volume', ((event: CustomEvent) => {
    const vol = event.detail?.volume;
    if (typeof vol !== 'number') return;

    scale = Math.max(0, Math.min(1, vol / 100));
    reapplyAll();
  }) as EventListener);
})();
