// Duplicate detection utilities for receipt scanning

import { differenceInDays, parseISO } from 'date-fns';
import { DuplicateCandidate } from '@/types/duplicate-detection';

/**
 * Compute SHA-256 hash for a file (receipt fingerprint)
 */
export const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Calculate duplicate score for a candidate transaction
 * 
 * Scoring breakdown:
 * - +60 for exact receipt hash match
 * - +25 for exact amount match (within $0.01)
 * - +10 for date within 1 day
 * - +5 for vendor normalized match
 */
export const calculateDuplicateScore = (
  candidate: Omit<DuplicateCandidate, 'score'>,
  amount: number,
  date: string,
  vendor: string,
  hash: string | null
): number => {
  let score = 0;

  // +60 for exact receipt hash match
  if (hash && candidate.receipt_hash && candidate.receipt_hash === hash) {
    score += 60;
  }

  // +25 for exact amount match (within $0.01)
  if (Math.abs(candidate.amount - amount) <= 0.01) {
    score += 25;
  }

  // +10 for date within 1 day
  try {
    const candidateDate = parseISO(candidate.expense_date);
    const targetDate = parseISO(date);
    const daysDiff = Math.abs(differenceInDays(candidateDate, targetDate));
    if (daysDiff <= 1) {
      score += 10;
    }
  } catch {
    // If date parsing fails, skip date scoring
  }

  // +5 for vendor match (normalized, case-insensitive)
  const normalizedVendor = vendor.toLowerCase().trim();
  const normalizedCandidate = (candidate.vendor_payee || '').toLowerCase().trim();
  if (
    normalizedVendor &&
    normalizedCandidate &&
    (normalizedVendor.includes(normalizedCandidate) || 
     normalizedCandidate.includes(normalizedVendor))
  ) {
    score += 5;
  }

  return score;
};

/**
 * Check if duplicates require blocking save action
 * Score >= 90 (hash match + amount or other matches) blocks save
 */
export const shouldBlockSave = (candidates: DuplicateCandidate[]): boolean => {
  return candidates.some(c => c.score >= 90);
};

/**
 * Get the highest scoring candidate
 */
export const getTopCandidate = (candidates: DuplicateCandidate[]): DuplicateCandidate | null => {
  if (candidates.length === 0) return null;
  return candidates.reduce((top, current) => 
    current.score > top.score ? current : top
  );
};

/**
 * Minimum score threshold to consider as a potential duplicate
 */
export const DUPLICATE_SCORE_THRESHOLD = 20;

/**
 * Score threshold that requires user decision before saving
 */
export const BLOCKING_SCORE_THRESHOLD = 90;
