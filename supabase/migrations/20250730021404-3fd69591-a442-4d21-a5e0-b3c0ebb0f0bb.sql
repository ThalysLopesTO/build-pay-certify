-- Add 'approved' to the request_status enum
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'approved';