-- Delete the existing Govan Brown company to allow registration flow to work
DELETE FROM public.companies WHERE name = 'Govan Brown' AND id = 'b3a42958-37f1-42cb-8cc3-f18c4adc3520';