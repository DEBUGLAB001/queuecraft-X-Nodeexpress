import { readData, writeData, resetData } from './storageService.js';
import { calculateQueuePosition, estimateWaitTimeMinutes } from '../utils/positionCalculator.js';

/**
 * Returns comprehensive queue dashboard state.
 */
export function getDashboardState() {
  const state = readData();
  const waitingTokens = state.tokens.filter((t) => t.status === 'waiting');
  const servingToken = state.tokens.find((t) => t.status === 'serving') || null;
  const completedTokens = state.tokens.filter((t) => t.status === 'completed');

  return {
    counters: state.counters,
    nowServing: servingToken,
    waitingTokens,
    completedTokens,
    stats: {
      totalWaiting: waitingTokens.length,
      totalServing: servingToken ? 1 : 0,
      totalCompleted: completedTokens.length,
      totalToday: state.tokens.length
    }
  };
}

/**
 * Creates and enqueues a new student token.
 *
 * @param {Object} payload - Validated token data { studentName, studentId, counter }
 * @returns {Object} Created token and its calculated queue position
 */
export function createToken({ studentName, studentId, counter }) {
  const state = readData();
  const tokenNumber = state.nextTokenNumber || 101;
  const tokenId = `T-${tokenNumber}`;

  const newToken = {
    id: tokenId,
    tokenNumber,
    studentName: studentName.trim(),
    studentId: studentId.trim(),
    counter,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    servedAt: null,
    completedAt: null
  };

  state.tokens.push(newToken);
  state.nextTokenNumber = tokenNumber + 1;
  writeData(state);

  const position = calculateQueuePosition(state.tokens, tokenId);
  const estimatedWait = estimateWaitTimeMinutes(position);

  return {
    token: newToken,
    position,
    estimatedWaitMinutes: estimatedWait
  };
}

/**
 * Calls the next eligible token from the waiting queue into service.
 *
 * @returns {Object} Result containing called token or message if empty
 */
export function callNextToken() {
  const state = readData();
  const waitingTokens = state.tokens.filter((t) => t.status === 'waiting');

  if (waitingTokens.length === 0) {
    return {
      success: false,
      message: 'Queue is empty. No students currently waiting.',
      token: null,
      nowServing: state.tokens.find((t) => t.status === 'serving') || null
    };
  }

  const nextToken = waitingTokens[waitingTokens.length - 1];

  // If a student is currently being served, mark them completed first
  state.tokens.forEach((t) => {
    if (t.status === 'serving') {
      t.status = 'completed';
      t.completedAt = new Date().toISOString();
    }
  });

  // Set the selected token to serving
  const target = state.tokens.find((t) => t.id === nextToken.id);
  if (target) {
    target.status = 'serving';
    target.servedAt = new Date().toISOString();
  }

  writeData(state);

  const updatedDashboard = getDashboardState();

  return {
    success: true,
    token: target,
    nowServing: target,
    waitingTokens: updatedDashboard.waitingTokens,
    stats: updatedDashboard.stats
  };
}

/**
 * Marks the currently serving token as completed.
 *
 * @param {string} [tokenId] - Optional specific token ID to complete
 * @returns {Object} Result of completion
 */
export function completeServingToken(tokenId) {
  const state = readData();

  let target;
  if (tokenId) {
    target = state.tokens.find((t) => t.id === tokenId && t.status === 'serving');
  } else {
    target = state.tokens.find((t) => t.status === 'serving');
  }

  if (!target) {
    return {
      success: false,
      message: 'No active token is currently being served.'
    };
  }

  target.status = 'completed';
  target.completedAt = new Date().toISOString();
  writeData(state);

  const updatedDashboard = getDashboardState();

  return {
    success: true,
    completedToken: target,
    nowServing: null,
    waitingTokens: updatedDashboard.waitingTokens,
    stats: updatedDashboard.stats
  };
}

/**
 * Retrieves the current queue position and status of a specific token.
 *
 * @param {string} tokenId
 * @returns {Object|null} Position details
 */
export function getTokenStatus(tokenId) {
  const state = readData();
  const token = state.tokens.find((t) => t.id === tokenId);

  if (!token) {
    return null;
  }

  const position = calculateQueuePosition(state.tokens, tokenId);
  const estimatedWait = estimateWaitTimeMinutes(position);

  return {
    token,
    position,
    estimatedWaitMinutes: estimatedWait
  };
}

/**
 * Resets application state to default demo data.
 */
export function resetQueueState() {
  const fresh = resetData();
  return getDashboardState();
}
