/**
 * Unit tests for content script
 */

import { applyVolume, findMediaElements } from '../../src/content/content-script';

describe('content script', () => {
  describe('applyVolume', () => {
    it('should set volume on audio element', () => {
      const audio = document.createElement('audio');
      audio.volume = 1.0;

      applyVolume(audio, 50);

      expect(audio.volume).toBe(0.5);
    });

    it('should set volume on video element', () => {
      const video = document.createElement('video');
      video.volume = 1.0;

      applyVolume(video, 75);

      expect(video.volume).toBe(0.75);
    });

    it('should convert 0 to 0.0', () => {
      const audio = document.createElement('audio');
      audio.volume = 1.0;

      applyVolume(audio, 0);

      expect(audio.volume).toBe(0.0);
    });

    it('should convert 100 to 1.0', () => {
      const audio = document.createElement('audio');
      audio.volume = 0.5;

      applyVolume(audio, 100);

      expect(audio.volume).toBe(1.0);
    });

    it('should handle decimal volumes', () => {
      const audio = document.createElement('audio');

      applyVolume(audio, 33);

      expect(audio.volume).toBe(0.33);
    });

    it('should clamp to minimum (0)', () => {
      const audio = document.createElement('audio');
      audio.volume = 0.5;

      applyVolume(audio, -10);

      expect(audio.volume).toBe(0.0);
    });

    it('should clamp to maximum (1.0)', () => {
      const audio = document.createElement('audio');
      audio.volume = 0.5;

      applyVolume(audio, 150);

      expect(audio.volume).toBe(1.0);
    });
  });

  describe('findMediaElements', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should find audio elements', () => {
      const audio1 = document.createElement('audio');
      const audio2 = document.createElement('audio');
      document.body.appendChild(audio1);
      document.body.appendChild(audio2);

      const elements = findMediaElements();

      expect(elements).toHaveLength(2);
      expect(elements).toContain(audio1);
      expect(elements).toContain(audio2);
    });

    it('should find video elements', () => {
      const video1 = document.createElement('video');
      const video2 = document.createElement('video');
      document.body.appendChild(video1);
      document.body.appendChild(video2);

      const elements = findMediaElements();

      expect(elements).toHaveLength(2);
      expect(elements).toContain(video1);
      expect(elements).toContain(video2);
    });

    it('should find both audio and video elements', () => {
      const audio = document.createElement('audio');
      const video = document.createElement('video');
      document.body.appendChild(audio);
      document.body.appendChild(video);

      const elements = findMediaElements();

      expect(elements).toHaveLength(2);
      expect(elements).toContain(audio);
      expect(elements).toContain(video);
    });

    it('should find nested media elements', () => {
      const div = document.createElement('div');
      const audio = document.createElement('audio');
      div.appendChild(audio);
      document.body.appendChild(div);

      const elements = findMediaElements();

      expect(elements).toHaveLength(1);
      expect(elements[0]).toBe(audio);
    });

    it('should return empty array when no media elements', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const elements = findMediaElements();

      expect(elements).toHaveLength(0);
    });

    it('should find media elements in specific container', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      const audio1 = document.createElement('audio');
      const audio2 = document.createElement('audio');

      container1.appendChild(audio1);
      container2.appendChild(audio2);
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const elements = findMediaElements(container1);

      expect(elements).toHaveLength(1);
      expect(elements[0]).toBe(audio1);
    });
  });
});
