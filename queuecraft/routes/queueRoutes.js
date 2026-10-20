import express from 'express';
import {
  getDashboardState,
  createToken,
  callNextToken,
  completeServingToken,
  getTokenStatus,
  resetQueueState
} from '../services/queueService.js';
import { validateTokenCreation } from '../utils/validator.js';

const router = express.Router();

/**
 * GET /api/queue
 * Returns full queue state including nowServing, waitingTokens, completedTokens, and stats.
 */
router.get('/queue', (req, res) => {
  try {
    const dashboard = getDashboardState();
    res.json({
      success: true,
      data: dashboard
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve queue state',
      details: err.message
    });
  }
});

/**
 * POST /api/tokens
 * Enqueues a new student token after validating inputs.
 */
router.post('/tokens', (req, res) => {
  try {
    const validation = validateTokenCreation(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { studentName, studentId, counter } = req.body;
    const result = createToken({ studentName, studentId, counter });

    res.status(201).json({
      success: true,
      message: 'Token generated successfully',
      token: result.token,
      position: result.position,
      estimatedWaitMinutes: result.estimatedWaitMinutes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create token',
      details: err.message
    });
  }
});

/**
 * GET /api/tokens/:id/position
 * Retrieves current position and wait time for a student token.
 */
router.get('/tokens/:id/position', (req, res) => {
  try {
    const tokenId = req.params.id;
    const status = getTokenStatus(tokenId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: `Token with ID "${tokenId}" was not found.`
      });
    }

    res.json({
      success: true,
      tokenId: status.token.id,
      studentName: status.token.studentName,
      status: status.token.status,
      counter: status.token.counter,
      position: status.position,
      estimatedWaitMinutes: status.estimatedWaitMinutes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to get token position',
      details: err.message
    });
  }
});

/**
 * POST /api/operator/call-next
 * Calls the next waiting student token.
 */
router.post('/operator/call-next', (req, res) => {
  try {
    const result = callNextToken();

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
        nowServing: result.nowServing
      });
    }

    res.json({
      success: true,
      message: `Token ${result.token.id} called to service counter.`,
      token: result.token,
      nowServing: result.nowServing,
      waitingTokens: result.waitingTokens,
      stats: result.stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to call next token',
      details: err.message
    });
  }
});

/**
 * POST /api/operator/complete
 * Marks currently serving token as completed.
 */
router.post('/operator/complete', (req, res) => {
  try {
    const { tokenId } = req.body || {};
    const result = completeServingToken(tokenId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: `Token ${result.completedToken.id} completed.`,
      completedToken: result.completedToken,
      nowServing: null,
      waitingTokens: result.waitingTokens,
      stats: result.stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete token',
      details: err.message
    });
  }
});

/**
 * POST /api/reset
 * Resets queue state to original demo fixtures.
 */
router.post('/reset', (req, res) => {
  try {
    const dashboard = resetQueueState();
    res.json({
      success: true,
      message: 'Queue demo state successfully reset to initial fixture.',
      data: dashboard
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset queue state',
      details: err.message
    });
  }
});

export default router;
