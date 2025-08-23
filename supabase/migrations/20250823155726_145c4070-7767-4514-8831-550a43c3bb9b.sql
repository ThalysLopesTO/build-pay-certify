-- Function to recalculate total_hours for bi-weekly timesheets with stored JSON data
CREATE OR REPLACE FUNCTION fix_biweekly_timesheet_totals()
RETURNS TABLE(
  timesheet_id uuid,
  old_total_hours numeric,
  new_total_hours numeric,
  hours_fixed boolean
) 
LANGUAGE plpgsql
AS $$
DECLARE
  timesheet_record RECORD;
  json_data jsonb;
  calculated_total numeric;
  hours_sum numeric;
BEGIN
  -- Process all timesheets with bi-weekly JSON data
  FOR timesheet_record IN 
    SELECT id, total_hours, notes 
    FROM weekly_timesheets 
    WHERE notes LIKE '%__biweekly_json__=%'
  LOOP
    BEGIN
      -- Extract and parse the bi-weekly JSON data
      SELECT regexp_replace(
        split_part(
          (SELECT string_agg(line, E'\n') FROM unnest(string_to_array(timesheet_record.notes, E'\n')) AS line WHERE line LIKE '__biweekly_json__=%'),
          '=', 2
        ),
        E'[\\r\\n]', '', 'g'
      ) INTO json_data;
      
      -- Decode base64 and parse JSON
      SELECT decode(json_data::text, 'base64')::text::jsonb INTO json_data;
      
      -- Calculate total from individual day hours
      SELECT COALESCE(
        (SELECT SUM((day->>'hours')::numeric) FROM jsonb_array_elements(json_data->'days') AS day),
        0
      ) INTO hours_sum;
      
      calculated_total := hours_sum;
      
      -- Check if recalculation is needed (more than 0.01 difference)
      IF ABS(calculated_total - COALESCE(timesheet_record.total_hours, 0)) > 0.01 THEN
        -- Update the total_hours field
        UPDATE weekly_timesheets 
        SET 
          total_hours = calculated_total,
          updated_at = NOW()
        WHERE id = timesheet_record.id;
        
        -- Return the fix details
        timesheet_id := timesheet_record.id;
        old_total_hours := timesheet_record.total_hours;
        new_total_hours := calculated_total;
        hours_fixed := true;
        RETURN NEXT;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue processing other records
        RAISE NOTICE 'Error processing timesheet %: %', timesheet_record.id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Execute the function to fix existing data
DO $$
DECLARE
  fix_count integer := 0;
  fix_record RECORD;
BEGIN
  -- Count and log fixes
  FOR fix_record IN SELECT * FROM fix_biweekly_timesheet_totals() LOOP
    fix_count := fix_count + 1;
    RAISE NOTICE 'Fixed timesheet %: % hours -> % hours', 
      fix_record.timesheet_id, 
      fix_record.old_total_hours, 
      fix_record.new_total_hours;
  END LOOP;
  
  RAISE NOTICE 'Total bi-weekly timesheets fixed: %', fix_count;
END;
$$;