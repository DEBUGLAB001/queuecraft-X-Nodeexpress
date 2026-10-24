/**
 * Queue Position Calculator Utility
 * Calculates the current position of a token among eligible waiting tokens.
 */

/**
 * Calculates a token's position in the waiting queue.
 *
 * @param {Array<Object>} tokens - Complete list of tokens from persistent state
 * @param {string} tokenId - ID of the token whose position is being queried
 * @returns {number|null} Position among waiting tokens, or null if token is not waiting
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
