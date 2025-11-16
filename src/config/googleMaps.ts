/**
 * Google Maps Configuration
 * 
 * Centralized configuration for Google Maps API integration across the application.
 * Uses the GOOGLE_MAPS_API_KEY from Supabase secrets.
 */

export const GOOGLE_MAPS_API_KEY = 'AIzaSyBgdO3avHHtY9d0TpYkxb22mcPGIPNWJvU';

export const GOOGLE_MAPS_CONFIG = {
  libraries: ['places', 'geometry'] as const,
  region: 'US',
  language: 'en',
};

export const AUTOCOMPLETE_OPTIONS = {
  types: ['address'] as const,
  componentRestrictions: { country: ['ca', 'us'] },
  fields: ['formatted_address', 'geometry.location', 'place_id'],
};
