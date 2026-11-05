import { describe, expect, test } from 'bun:test';
import { OperationTimeoutError, withDeadline } from '../src/utils/withDeadline';

describe('Email operation deadline', () => {
  test('returns a completed operation', async () => {
    expect(await withDeadline(Promise.resolve('sent'), 100, 'Unknown delivery')).toBe('sent');
  });
  test('releases a pending operation with a distinguishable unknown-result error', async () => {
    await expect(withDeadline(new Promise(() => {}), 5, 'Check delivery before retrying'))
      .rejects.toBeInstanceOf(OperationTimeoutError);
  });
  test('preserves an actual failure for normal error handling', async () => {
    await expect(withDeadline(Promise.reject(new Error('Delivery rejected')), 100, 'Unknown delivery'))
      .rejects.toThrow('Delivery rejected');
  });
});