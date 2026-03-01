/**
 * Unit tests for popup logic
 */

import chromeMock from '../mocks/chrome';

// Mock the popup module functions
const getCurrentDomain = async (): Promise<string> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.url) {
    try {
      const url = new URL(tabs[0].url);
      return url.hostname;
    } catch {
      return '';
    }
  }
  return '';
};

const normalizeForDisplay = (domain: string): string => {
  if (!domain) return '';
  let normalized = domain.toLowerCase();
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }
  return normalized;
};

describe('popup logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentDomain', () => {
    it('should get domain from active tab', async () => {
      const mockTabs = [
        {
          id: 1,
          url: 'https://example.com/path',
          active: true,
        },
      ];
      chromeMock.tabs.query.mockResolvedValue(mockTabs as any);

      const domain = await getCurrentDomain();

      expect(domain).toBe('example.com');
      expect(chromeMock.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
    });

    it('should handle URL with www', async () => {
      const mockTabs = [
        {
          id: 1,
          url: 'https://www.example.com/path',
          active: true,
        },
      ];
      chromeMock.tabs.query.mockResolvedValue(mockTabs as any);

      const domain = await getCurrentDomain();

      expect(domain).toBe('www.example.com');
    });

    it('should return empty string when no active tab', async () => {
      chromeMock.tabs.query.mockResolvedValue([]);

      const domain = await getCurrentDomain();

      expect(domain).toBe('');
    });

    it('should return empty string when tab has no URL', async () => {
      const mockTabs = [
        {
          id: 1,
          active: true,
        },
      ];
      chromeMock.tabs.query.mockResolvedValue(mockTabs as any);

      const domain = await getCurrentDomain();

      expect(domain).toBe('');
    });

    it('should handle invalid URL', async () => {
      const mockTabs = [
        {
          id: 1,
          url: 'not-a-valid-url',
          active: true,
        },
      ];
      chromeMock.tabs.query.mockResolvedValue(mockTabs as any);

      const domain = await getCurrentDomain();

      expect(domain).toBe('');
    });
  });

  describe('normalizeForDisplay', () => {
    it('should remove www prefix', () => {
      expect(normalizeForDisplay('www.example.com')).toBe('example.com');
    });

    it('should convert to lowercase', () => {
      expect(normalizeForDisplay('EXAMPLE.COM')).toBe('example.com');
    });

    it('should handle domain without www', () => {
      expect(normalizeForDisplay('example.com')).toBe('example.com');
    });

    it('should handle empty string', () => {
      expect(normalizeForDisplay('')).toBe('');
    });

    it('should handle mixed case with www', () => {
      expect(normalizeForDisplay('WWW.ExAmPlE.CoM')).toBe('example.com');
    });
  });
});
