-- Clean up test material requests data
DELETE FROM material_requests 
WHERE material_list ILIKE '%teste%' OR material_list ILIKE '%test test%';