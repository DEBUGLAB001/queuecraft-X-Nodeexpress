# QueueCraft

## Description
QueueCraft is a real-time university queue management system built with Node.js and Express that coordinates student service counters for Library Assistance, IT Help Desk, and Student Administration. The application entry point is `server.js`, which binds to `0.0.0.0` on port `3000` (or `process.env.PORT`) and handles static assets and preview proxy routing (`/runtime/{runtime_id}/preview/`). Core domain logic resides in `services/queueService.js`, managing FIFO queue operations, token lifecycles, and dashboard state. Local persistence is handled by `services/storageService.js` through safe read/write operations against `data/queue-data.json`. Input validation is performed by `utils/validator.js`, while queue positions and wait times are computed by `utils/positionCalculator.js`. The single-page frontend in `public/` communicates with Express REST endpoints via relative paths.

## Repository Structure
```
.
├── challenge.json              # DEBUG//LAB runtime and topic configuration
├── data/
│   └── queue-data.json         # Local persistent JSON datastore
├── package.json
├── public/
│   ├── app.js                  # Frontend UI controller and state synchronization
│   ├── index.html              # University queue dashboard layout
│   └── styles.css              # Dashboard styling and visual indicators
├── routes/
│   └── queueRoutes.js          # REST API endpoints for queue and operator actions
├── server.js                   # Application server and proxy route handler
├── services/
│   ├── queueService.js         # Queue domain logic and token state transitions
│   └── storageService.js       # JSON file persistence and demo fixture reset
├── start.sh                    # Container startup and watch script
└── utils/
    ├── positionCalculator.js   # Queue position and wait time calculation
    └── validator.js            # Input validation schemas for token creation
```

## Bugs and Bug Locations

1. Incorrect FIFO Queue Processing Order
- Bug location: "services/queueService.js", within `callNextToken()` (line 83).
- How to observe it: Ensure multiple tokens are waiting in queue (e.g. T-103, T-104, T-105) and invoke POST `/api/operator/call-next` or click "Call Next Token" in the operator console.
- Failure: The newest token (T-105) is called instead of the oldest waiting token (T-103) because the operation selects `waitingTokens[waitingTokens.length - 1]` instead of `waitingTokens[0]`.
- Expected: Queue operations must follow First-In, First-Out (FIFO) ordering by calling the earliest waiting token `waitingTokens[0]`.

2. Zero-Indexed Queue Position Calculation
- Bug location: "utils/positionCalculator.js", within `calculateQueuePosition()` (line 29).
- How to observe it: Create a token when the waiting queue is empty or query GET `/api/tokens/:id/position` for the first waiting token.
- Failure: Returns the 0-based array index `index`, displaying queue position `#0` on the student ticket card instead of position `#1`.
- Expected: Waiting positions must be 1-based, returning `index + 1` for eligible waiting tokens.

3. Incomplete Validation for Token Creation
- Bug location: "utils/validator.js", within `validateTokenCreation()` (line 28).
- How to observe it: Submit a POST request to `/api/tokens` with an empty string `""` or whitespace `"   "` as `studentName`.
- Failure: Validation succeeds and creates an active token because the condition only checks `body.studentName === undefined`, allowing blank and whitespace-only strings.
- Expected: Submissions with empty or whitespace-only student names must be rejected with HTTP 400 Bad Request without creating or saving a token.

4. Waiting Queue UI Desynchronization on Call Next
- Bug location: "public/app.js", within `handleCallNext()` (line 318).
- How to observe it: Click "Call Next Token" in the operator console while students are listed in the Live Waiting Queue table.
- Failure: The Now Serving panel updates, but `renderWaitingQueue(data.waitingTokens)` is omitted, leaving the called student rendered in the waiting queue table until a manual page reload.
- Expected: Calling next token must immediately re-render and synchronize the visible waiting queue list with the server response by calling `renderWaitingQueue(data.waitingTokens)`.
