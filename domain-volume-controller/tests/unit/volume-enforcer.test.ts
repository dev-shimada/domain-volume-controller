/**
 * Unit tests for the volume enforcer (MAIN world script)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Web Audio mocks: must exist before the enforcer module is loaded ---

class MockAudioNode {
  context: any;
  connections: any[] = [];

  constructor(context?: any) {
    this.context = context;
  }

  connect(destination: any, _output?: number, _input?: number): any {
    this.connections.push(destination);
    return destination;
  }

  disconnect(...args: any[]): void {
    if (args.length === 0) {
      this.connections = [];
      return;
    }
    const index = this.connections.indexOf(args[0]);
    if (index === -1) {
      throw new Error('InvalidAccessError');
    }
    this.connections.splice(index, 1);
  }
}

class MockAudioDestinationNode extends MockAudioNode {}

class MockGainNode extends MockAudioNode {
  gain = { value: 1 };
}

class MockAudioContext {
  destination: MockAudioDestinationNode;

  constructor() {
    this.destination = new MockAudioDestinationNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  createMediaElementSource(_element: HTMLMediaElement): MockAudioNode {
    return new MockAudioNode(this);
  }
}

(globalThis as any).AudioNode = MockAudioNode;
(globalThis as any).AudioDestinationNode = MockAudioDestinationNode;
(globalThis as any).GainNode = MockGainNode;
(globalThis as any).AudioContext = MockAudioContext;

// jsdom does not implement play(); stub it before the enforcer hooks it
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  value: jest.fn().mockResolvedValue(undefined),
  writable: true,
  configurable: true,
});

// Capture the native volume accessors before the enforcer replaces them
const nativeVolume = Object.getOwnPropertyDescriptor(
  HTMLMediaElement.prototype,
  'volume'
)!;

// Load the enforcer for its side effects (prototype patches, event listener)
require('../../src/content/volume-enforcer');

/** Read the real (scaled) volume, bypassing the enforcer's getter */
function actualVolume(el: HTMLMediaElement): number {
  return nativeVolume.get!.call(el);
}

function setScale(volumePercent: number): void {
  window.dispatchEvent(
    new CustomEvent('__dvc_set_volume', { detail: { volume: volumePercent } })
  );
}

describe('volume enforcer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setScale(100);
  });

  describe('media element scaling', () => {
    it('scales page-set volume while reporting the intended value back', () => {
      setScale(50);
      const audio = document.createElement('audio');

      audio.volume = 0.8;

      expect(audio.volume).toBeCloseTo(0.8);
      expect(actualVolume(audio)).toBeCloseTo(0.4);
    });

    it('keeps page-side volume controls working under scaling', () => {
      setScale(50);
      const audio = document.createElement('audio');

      audio.volume = 1.0;
      expect(actualVolume(audio)).toBeCloseTo(0.5);

      audio.volume = 0.2;
      expect(actualVolume(audio)).toBeCloseTo(0.1);
    });

    it('reapplies a scale change to elements in the DOM', () => {
      const video = document.createElement('video');
      document.body.appendChild(video);
      video.volume = 0.8;

      setScale(30);

      expect(video.volume).toBeCloseTo(0.8);
      expect(actualVolume(video)).toBeCloseTo(0.24);
    });

    it('reapplies a scale change to detached elements', () => {
      const audio = document.createElement('audio');
      audio.volume = 0.6;

      setScale(50);

      expect(actualVolume(audio)).toBeCloseTo(0.3);
    });

    it('reaches media elements inside closed shadow roots', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: 'closed' });
      const video = document.createElement('video');
      root.appendChild(video);

      setScale(50);

      expect(actualVolume(video)).toBeCloseTo(0.5);
    });

    it('scales elements on play() even if the page never sets a volume', () => {
      setScale(50);
      const video = document.createElement('video');

      video.play();

      expect(actualVolume(video)).toBeCloseTo(0.5);
    });
  });

  describe('Web Audio API scaling', () => {
    it('routes destination connections through a gain node', () => {
      setScale(50);
      const ctx: any = new (globalThis as any).AudioContext();
      const source: any = new (globalThis as any).AudioNode(ctx);

      const returned = source.connect(ctx.destination);

      expect(returned).toBe(ctx.destination);
      expect(source.connections).toHaveLength(1);
      const gain = source.connections[0];
      expect(gain).toBeInstanceOf(MockGainNode);
      expect(gain.gain.value).toBeCloseTo(0.5);
      expect(gain.connections).toContain(ctx.destination);
    });

    it('does not touch node-to-node connections', () => {
      const ctx: any = new (globalThis as any).AudioContext();
      const a: any = new (globalThis as any).AudioNode(ctx);
      const b: any = new (globalThis as any).AudioNode(ctx);

      a.connect(b);

      expect(a.connections).toEqual([b]);
    });

    it('updates the gain node when the scale changes', () => {
      const ctx: any = new (globalThis as any).AudioContext();
      const source: any = new (globalThis as any).AudioNode(ctx);
      source.connect(ctx.destination);
      const gain = source.connections[0];

      setScale(25);

      expect(gain.gain.value).toBeCloseTo(0.25);
    });

    it('remaps disconnect(destination) to the interposed gain node', () => {
      const ctx: any = new (globalThis as any).AudioContext();
      const source: any = new (globalThis as any).AudioNode(ctx);
      source.connect(ctx.destination);

      expect(() => source.disconnect(ctx.destination)).not.toThrow();
      expect(source.connections).toHaveLength(0);
    });

    it('unscales media elements routed through createMediaElementSource', () => {
      setScale(50);
      const ctx: any = new (globalThis as any).AudioContext();
      const audio = document.createElement('audio');
      audio.volume = 0.8;
      expect(actualVolume(audio)).toBeCloseTo(0.4);

      ctx.createMediaElementSource(audio);

      // The element itself is no longer scaled — the gain node handles it
      expect(actualVolume(audio)).toBeCloseTo(0.8);

      audio.volume = 0.6;
      expect(actualVolume(audio)).toBeCloseTo(0.6);
    });
  });
});
