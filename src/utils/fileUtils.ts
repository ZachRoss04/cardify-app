/**
 * Utility functions for handling file uploads
 */

/**
 * Creates a safe file representation that won't cause React rendering issues
 */
export interface SafeFileRepresentation {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  fileObject: File;
}

/**
 * Converts a File object to a safe representation for React state
 */
export const createSafeFileRepresentation = (file: File): SafeFileRepresentation => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    fileObject: file
  };
};
