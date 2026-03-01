/**
 * Unit tests for storage operations
 */

import { getVolumeForDomain, setVolumeForDomain, getAllVolumes } from '../../src/shared/storage';
import chromeMock from '../mocks/chrome';

describe('storage operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVolumeForDomain', () => {
    it('should return stored volume for domain', async () => {
      const mockData = {
        domainVolumes: {
          'example.com': 50,
          'test.com': 75,
        },
      };
      chromeMock.storage.local.get.mockResolvedValue(mockData);

      const volume = await getVolumeForDomain('example.com');
      expect(volume).toBe(50);
      expect(chromeMock.storage.local.get).toHaveBeenCalledWith('domainVolumes');
    });

    it('should return 100 (default) for domain without setting', async () => {
      const mockData = {
        domainVolumes: {
          'example.com': 50,
        },
      };
      chromeMock.storage.local.get.mockResolvedValue(mockData);

      const volume = await getVolumeForDomain('other.com');
      expect(volume).toBe(100);
    });

    it('should return 100 (default) when storage is empty', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});

      const volume = await getVolumeForDomain('example.com');
      expect(volume).toBe(100);
    });

    it('should return 100 (default) when domainVolumes is undefined', async () => {
      chromeMock.storage.local.get.mockResolvedValue({ domainVolumes: undefined });

      const volume = await getVolumeForDomain('example.com');
      expect(volume).toBe(100);
    });

    it('should handle empty domain', async () => {
      const volume = await getVolumeForDomain('');
      expect(volume).toBe(100);
    });
  });

  describe('setVolumeForDomain', () => {
    it('should save volume for new domain', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', 50);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 50,
        },
      });
    });

    it('should update volume for existing domain', async () => {
      const mockData = {
        domainVolumes: {
          'example.com': 50,
          'test.com': 75,
        },
      };
      chromeMock.storage.local.get.mockResolvedValue(mockData);
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', 80);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 80,
          'test.com': 75,
        },
      });
    });

    it('should clamp volume to minimum (0)', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', -10);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 0,
        },
      });
    });

    it('should clamp volume to maximum (100)', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', 150);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 100,
        },
      });
    });

    it('should accept volume at minimum boundary (0)', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', 0);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 0,
        },
      });
    });

    it('should accept volume at maximum boundary (100)', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('example.com', 100);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          'example.com': 100,
        },
      });
    });

    it('should handle empty domain gracefully', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      await setVolumeForDomain('', 50);

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        domainVolumes: {
          '': 50,
        },
      });
    });
  });

  describe('getAllVolumes', () => {
    it('should return all domain volumes', async () => {
      const mockData = {
        domainVolumes: {
          'example.com': 50,
          'test.com': 75,
        },
      };
      chromeMock.storage.local.get.mockResolvedValue(mockData);

      const volumes = await getAllVolumes();
      expect(volumes).toEqual({
        'example.com': 50,
        'test.com': 75,
      });
    });

    it('should return empty object when no volumes stored', async () => {
      chromeMock.storage.local.get.mockResolvedValue({});

      const volumes = await getAllVolumes();
      expect(volumes).toEqual({});
    });

    it('should return empty object when domainVolumes is undefined', async () => {
      chromeMock.storage.local.get.mockResolvedValue({ domainVolumes: undefined });

      const volumes = await getAllVolumes();
      expect(volumes).toEqual({});
    });
  });
});
