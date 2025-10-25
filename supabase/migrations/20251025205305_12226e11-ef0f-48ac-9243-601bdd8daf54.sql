-- Add weather location fields to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS weather_latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS weather_longitude DECIMAL(11, 8) NULL,
ADD COLUMN IF NOT EXISTS weather_location_name TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.company_settings.weather_latitude IS 'Latitude for company weather location (-90 to 90)';
COMMENT ON COLUMN public.company_settings.weather_longitude IS 'Longitude for company weather location (-180 to 180)';
COMMENT ON COLUMN public.company_settings.weather_location_name IS 'Human-readable location name (e.g., "Edmonton, Alberta, Canada")';