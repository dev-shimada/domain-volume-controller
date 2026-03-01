/**
 * Unit tests for domain utility functions
 */

import { extractDomain, normalizeDomain } from '../../src/utils/domain';

describe('domain utilities', () => {
  describe('extractDomain', () => {
    it('should extract domain from http URL', () => {
      expect(extractDomain('http://example.com/path')).toBe('example.com');
    });

    it('should extract domain from https URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain with subdomain', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    });

    it('should extract domain with port', () => {
      expect(extractDomain('https://example.com:8080/path')).toBe('example.com');
    });

    it('should extract domain with query parameters', () => {
      expect(extractDomain('https://example.com/path?query=value')).toBe('example.com');
    });

    it('should extract domain with hash', () => {
      expect(extractDomain('https://example.com/path#hash')).toBe('example.com');
    });

    it('should handle localhost', () => {
      expect(extractDomain('http://localhost:3000/path')).toBe('localhost');
    });

    it('should handle IP address', () => {
      expect(extractDomain('http://192.168.1.1/path')).toBe('192.168.1.1');
    });

    it('should return empty string for invalid URL', () => {
      expect(extractDomain('not-a-url')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(extractDomain('')).toBe('');
    });

    it('should handle complex subdomain', () => {
      expect(extractDomain('https://blog.en.example.com/path')).toBe('blog.en.example.com');
    });
  });

  describe('normalizeDomain', () => {
    it('should convert to lowercase', () => {
      expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
    });

    it('should remove www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
    });

    it('should remove WWW prefix (uppercase)', () => {
      expect(normalizeDomain('WWW.EXAMPLE.COM')).toBe('example.com');
    });

    it('should handle domain without www', () => {
      expect(normalizeDomain('example.com')).toBe('example.com');
    });

    it('should handle subdomain that is not www', () => {
      expect(normalizeDomain('blog.example.com')).toBe('blog.example.com');
    });

    it('should handle www in middle of domain', () => {
      expect(normalizeDomain('blog.www.example.com')).toBe('blog.www.example.com');
    });

    it('should handle localhost', () => {
      expect(normalizeDomain('localhost')).toBe('localhost');
    });

    it('should handle IP address', () => {
      expect(normalizeDomain('192.168.1.1')).toBe('192.168.1.1');
    });

    it('should handle empty string', () => {
      expect(normalizeDomain('')).toBe('');
    });

    it('should handle mixed case with www', () => {
      expect(normalizeDomain('WwW.ExAmPlE.CoM')).toBe('example.com');
    });
  });
});
