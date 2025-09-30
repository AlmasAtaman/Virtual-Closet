/**
 * Safely get the base URL for the application
 * Works during both server-side rendering and client-side execution
 */
export const getBaseUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // During build/SSR, use environment variable or fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vestko.com';
};

/**
 * Safely redirect to a URL (client-side only)
 */
export const safeRedirect = (url: string): void => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};