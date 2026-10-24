import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resetData, readData, writeData } from '../services/storageService.js';
import { callNextToken } from '../services/queueService.js';
import { calculateQueuePosition } from '../utils/positionCalculator.js';
import { validateTokenCreation } from '../utils/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const tests = {
  async test_queue_order() {
    resetData();

    const state = readData();
    state.tokens = [
      {
        id: 'TEST-1',
        tokenNumber: 901,
        studentName: 'Student One',
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
        studentName: 'Student Two',
        studentId: 'STU-1002',
        counter: 'it-help',
        status: 'waiting',
        createdAt: '2026-10-20T10:05:00.000Z',
        servedAt: null,
        completedAt: null
      }
    ];
    writeData(state);

    const result = callNextToken();

    assert.equal(result.success, true, 'callNextToken should succeed');
    assert.ok(result.token, 'A token should be returned');
    assert.equal(
      result.token.id,
      'TEST-1',
      `Expected token 'TEST-1', but received '${result.token.id}'.`
    );
  },

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
      `Expected position to be 1, but received ${posFirst}.`
    );
    assert.equal(
      posSecond,
      2,
      `Expected position to be 2, but received ${posSecond}.`
    );
    assert.equal(
      posThird,
      3,
      `Expected position to be 3, but received ${posThird}.`
    );
  },

  async test_token_validation() {
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

    const validResult = validateTokenCreation({
      studentName: 'Alex Rivers',
      studentId: 'STU-9999',
      counter: 'library'
    });

    assert.equal(validResult.isValid, true, 'Validation should accept valid input');
  },

  async test_frontend_state_synchronization() {
    const appJsPath = path.resolve(__dirname, '../public/app.js');
    const content = fs.readFileSync(appJsPath, 'utf-8');

    const match = content.match(/async\s+function\s+handleCallNext\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(match, 'handleCallNext function must exist in public/app.js');

    const fnBody = match[1];

    const activeCodeLines = fnBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*'));

    const callsWaitingQueue = activeCodeLines.some(
      (line) => line.includes('renderWaitingQueue(') || line.includes('loadDashboardState(')
    );

    assert.ok(
      callsWaitingQueue,
      'Frontend state desynchronization: Waiting queue view was not updated when calling next token.'
    );
  }
};
