import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resetData, readData, writeData } from '../services/storageService.js';
import { callNextToken, createToken, completeServingToken, getDashboardState } from '../services/queueService.js';
import { calculateQueuePosition } from '../utils/positionCalculator.js';
import { validateTokenCreation } from '../utils/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const tests = {
  /**
   * Bug 1 Regression Check: FIFO Queue Ordering
   * The queue must strictly follow First-In, First-Out order.
   * Oldest waiting token must be called first.
   */
  async test_queue_order() {
    // Reset to clean test state
    resetData();

    // Create a known state with two distinct waiting tokens
    const state = readData();
    state.tokens = [
      {
        id: 'TEST-1',
        tokenNumber: 901,
        studentName: 'First Student (Oldest)',
        studentId: 'STU-1001',
        counter: 'library',
        status: 'waiting',
        createdAt: '2026-10-20T10:00:00.000Z',
        servedAt: null,
        completedAt: null
      },
      {
        id: 'TEST-2',
        tokenNumber: 902,
        studentName: 'Second Student (Newer)',
        studentId: 'STU-1002',
        counter: 'it-help',
        status: 'waiting',
        createdAt: '2026-10-20T10:05:00.000Z',
        servedAt: null,
        completedAt: null
      }
    ];
    writeData(state);

    // Operator calls next token
    const result = callNextToken();

    assert.equal(result.success, true, 'callNextToken should succeed');
    assert.ok(result.token, 'A token should be returned');
    assert.equal(
      result.token.id,
      'TEST-1',
      `FIFO violation: Expected oldest token 'TEST-1' to be called first, but received '${result.token.id}'.`
    );
  },

  /**
   * Bug 2 Regression Check: Queue Position Numbering
   * Waiting positions must be 1-based (position 1 is first in line).
   */
  async test_position_calculation() {
    const mockTokens = [
      { id: 'T-1', status: 'waiting' },
      { id: 'T-2', status: 'waiting' },
      { id: 'T-3', status: 'serving' },
      { id: 'T-4', status: 'waiting' }
    ];

    const posFirst = calculateQueuePosition(mockTokens, 'T-1');
    const posSecond = calculateQueuePosition(mockTokens, 'T-2');
    const posThird = calculateQueuePosition(mockTokens, 'T-4');

    assert.equal(
      posFirst,
      1,
      `Expected position for first waiting token to be 1, but received ${posFirst}.`
    );
    assert.equal(
      posSecond,
      2,
      `Expected position for second waiting token to be 2, but received ${posSecond}.`
    );
    assert.equal(
      posThird,
      3,
      `Expected position for third waiting token to be 3, but received ${posThird}.`
    );
  },

  /**
   * Bug 3 Regression Check: Token Creation Validation
   * Empty or whitespace-only student names must be rejected with 4xx validation failure.
   */
  async test_token_validation() {
    // 1. Whitespace studentName
    const whitespaceResult = validateTokenCreation({
      studentName: '   ',
      studentId: 'STU-9999',
      counter: 'library'
    });

    assert.equal(
      whitespaceResult.isValid,
      false,
      'Validation should reject whitespace-only student name'
    );
    assert.ok(
      whitespaceResult.errors.some((e) => e.toLowerCase().includes('name')),
      'Validation errors must include student name error'
    );

    // 2. Empty string studentName
    const emptyResult = validateTokenCreation({
      studentName: '',
      studentId: 'STU-9999',
      counter: 'library'
    });

    assert.equal(
      emptyResult.isValid,
      false,
      'Validation should reject empty string student name'
    );

    // 3. Valid submission
    const validResult = validateTokenCreation({
      studentName: 'Alex Rivers',
      studentId: 'STU-9999',
      counter: 'library'
    });

    assert.equal(validResult.isValid, true, 'Validation should accept valid input');
  },

  /**
   * Bug 4 Regression Check: Frontend State Synchronization
   * public/app.js must synchronize the waiting queue list in handleCallNext.
   */
  async test_frontend_state_synchronization() {
    const appJsPath = path.resolve(__dirname, '../public/app.js');
    const content = fs.readFileSync(appJsPath, 'utf-8');

    // Extract handleCallNext function implementation
    const match = content.match(/async\s+function\s+handleCallNext\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(match, 'handleCallNext function must exist in public/app.js');

    const fnBody = match[1];

    // Check if renderWaitingQueue or loadDashboardState is actively called (ignore comments)
    const activeCodeLines = fnBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*'));

    const callsWaitingQueue = activeCodeLines.some(
      (line) => line.includes('renderWaitingQueue(') || line.includes('loadDashboardState(')
    );

    assert.ok(
      callsWaitingQueue,
      "Frontend state desynchronization: handleCallNext() does not update the waiting queue view with 'renderWaitingQueue(data.waitingTokens)'."
    );
  },

  /**
   * Core Regression Check: Operator State Transitions
   * Completing a token transitions it to completed and resets active serving.
   */
  async test_operator_state_changes() {
    resetData();
    const state = readData();

    // Ensure one token is serving
    state.tokens.push({
      id: 'OP-SERVING',
      tokenNumber: 950,
      studentName: 'Serving Candidate',
      studentId: 'STU-950',
      counter: 'library',
      status: 'serving',
      createdAt: new Date().toISOString(),
      servedAt: new Date().toISOString(),
      completedAt: null
    });
    writeData(state);

    const completeResult = completeServingToken('OP-SERVING');
    assert.equal(completeResult.success, true, 'completeServingToken should succeed');
    assert.equal(completeResult.completedToken.status, 'completed');
    assert.equal(completeResult.nowServing, null);
  },

  /**
   * Core Regression Check: Data Persistence Consistency
   * Reset data and token generation correctly persist to disk and reload.
   */
  async test_persistence_consistency() {
    resetData();
    const created = createToken({
      studentName: 'Persistence Check',
      studentId: 'STU-PERSIST',
      counter: 'it-help'
    });

    assert.ok(created.token);
    assert.equal(created.token.studentName, 'Persistence Check');

    // Reload raw data from storage
    const reloaded = readData();
    const found = reloaded.tokens.find((t) => t.id === created.token.id);

    assert.ok(found, 'Token must be safely persisted to disk');
    assert.equal(found.status, 'waiting');
  }
};
