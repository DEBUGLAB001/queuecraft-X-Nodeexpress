/**
 * Input Validation Utilities for QueueCraft
 */

const ALLOWED_COUNTERS = ['library', 'it-help', 'admin'];

/**
 * Validates the student token creation request payload.
 *
 * Requirements:
 * - studentName: non-empty string after trimming
 * - studentId: non-empty string after trimming
 * - counter: one of allowed service counter IDs
 *
 * @param {Object} body - Request body
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateTokenCreation(body) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      errors: ['Request body must be a valid JSON object']
    };
  }

  // BUG 3 (Intentional): Defective validation for studentName
  // Checks only if studentName is undefined, allowing blank strings or whitespace ("   ")
  // Correct implementation:
  // if (!body.studentName || typeof body.studentName !== 'string' || !body.studentName.trim()) {
  //   errors.push('Student name is required and cannot be empty');
  // }
  if (body.studentName === undefined) {
    errors.push('Student name is required and cannot be empty');
  }

  if (
    !body.studentId ||
    typeof body.studentId !== 'string' ||
    !body.studentId.trim()
  ) {
    errors.push('Student ID is required and cannot be empty');
  }

  if (!body.counter || !ALLOWED_COUNTERS.includes(body.counter)) {
    errors.push(
      `Service counter must be one of: ${ALLOWED_COUNTERS.join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
