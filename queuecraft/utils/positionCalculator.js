/**
 * Queue Position Calculator Utility
 * Calculates the current position of a token among eligible waiting tokens.
 */

/**
 * Calculates a token's position in the waiting queue.
 * Waiting positions should be 1-based (position 1 is first in line).
 *
 * @param {Array<Object>} tokens - Complete list of tokens from persistent state
 * @param {string} tokenId - ID of the token whose position is being queried
 * @returns {number|null} 1-based position among waiting tokens, or null if token is not waiting
 */
export function calculateQueuePosition(tokens, tokenId) {
  if (!Array.isArray(tokens) || !tokenId) {
    return null;
  }

  // Filter only tokens currently in "waiting" status
  const waitingTokens = tokens.filter((token) => token.status === 'waiting');

  // Find index of the specified token within the waiting list
  const index = waitingTokens.findIndex((token) => token.id === tokenId);

  if (index === -1) {
    return null;
  }

  // BUG 2 (Intentional): Returns 0-based index instead of 1-based position
  // First student in line receives position 0 instead of 1.
  // Correct implementation: return index + 1;
  return index;
}

/**
 * Estimates wait time in minutes based on queue position.
 * Assumes an average service time of 5 minutes per student.
 *
 * @param {number|null} position - The student's position in queue
 * @returns {number} Estimated wait time in minutes
 */
export function estimateWaitTimeMinutes(position) {
  if (position === null || position === undefined || position <= 0) {
    return 0;
  }
  return position * 5;
}
