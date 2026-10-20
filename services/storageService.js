import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'queue-data.json');

const INITIAL_STATE = {
  counters: [
    {
      id: 'library',
      name: 'Library Assistance',
      description: 'Book loans, research archives, and study carrels'
    },
    {
      id: 'it-help',
      name: 'IT Help Desk',
      description: 'Campus Wi-Fi, student email, and software licensing'
    },
    {
      id: 'admin',
      name: 'Student Administration',
      description: 'Transcripts, enrollment verification, and ID cards'
    }
  ],
  tokens: [
    {
      id: 'T-101',
      tokenNumber: 101,
      studentName: 'Alice Johnson',
      studentId: 'STU-8821',
      counter: 'library',
      status: 'completed',
      createdAt: '2026-10-20T09:15:00.000Z',
      servedAt: '2026-10-20T09:20:00.000Z',
      completedAt: '2026-10-20T09:35:00.000Z'
    },
    {
      id: 'T-102',
      tokenNumber: 102,
      studentName: 'Bob Martinez',
      studentId: 'STU-4310',
      counter: 'it-help',
      status: 'serving',
      createdAt: '2026-10-20T09:25:00.000Z',
      servedAt: '2026-10-20T09:36:00.000Z',
      completedAt: null
    },
    {
      id: 'T-103',
      tokenNumber: 103,
      studentName: 'Charlie Kim',
      studentId: 'STU-9923',
      counter: 'library',
      status: 'waiting',
      createdAt: '2026-10-20T09:30:00.000Z',
      servedAt: null,
      completedAt: null
    },
    {
      id: 'T-104',
      tokenNumber: 104,
      studentName: 'Diana Patel',
      studentId: 'STU-1289',
      counter: 'admin',
      status: 'waiting',
      createdAt: '2026-10-20T09:40:00.000Z',
      servedAt: null,
      completedAt: null
    },
    {
      id: 'T-105',
      tokenNumber: 105,
      studentName: 'Evan Wright',
      studentId: 'STU-7741',
      counter: 'it-help',
      status: 'waiting',
      createdAt: '2026-10-20T09:45:00.000Z',
      servedAt: null,
      completedAt: null
    }
  ],
  nextTokenNumber: 106
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readData() {
  ensureDataDirectory();
  if (!fs.existsSync(DATA_FILE)) {
    writeData(INITIAL_STATE);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading data file, re-initializing with seed data:', error.message);
    writeData(INITIAL_STATE);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
}

export function writeData(data) {
  ensureDataDirectory();
  const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    // Fallback if atomic rename fails on Windows
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (writeErr) {
      console.error('Failed to write data file:', writeErr.message);
      throw writeErr;
    }
  }
}

export function resetData() {
  const fresh = JSON.parse(JSON.stringify(INITIAL_STATE));
  writeData(fresh);
  return fresh;
}
