/**
 * Type definitions for Domain Volume Controller
 */

/**
 * Volume setting for a specific domain
 * Volume is stored as percentage (0-100)
 */
export interface DomainVolume {
  domain: string;
  volume: number; // 0-100
  lastUpdated?: number; // timestamp
}

/**
 * Storage structure for all domain volumes
 * Key: normalized domain (lowercase, no www)
 * Value: volume percentage (0-100)
 */
export interface VolumeSettings {
  [domain: string]: number;
}

/**
 * Message types for communication between components
 */
export enum MessageType {
  GET_VOLUME = 'GET_VOLUME',
  SET_VOLUME = 'SET_VOLUME',
  APPLY_VOLUME = 'APPLY_VOLUME',
}

/**
 * Message structure for chrome.runtime.sendMessage
 */
export interface Message {
  type: MessageType;
  domain?: string;
  volume?: number;
}

/**
 * Response structure for messages
 */
export interface MessageResponse {
  success: boolean;
  volume?: number;
  error?: string;
}

/**
 * Constants for volume control
 */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 100;

/**
 * Storage key for volume settings
 */
export const STORAGE_KEY = 'domainVolumes';
