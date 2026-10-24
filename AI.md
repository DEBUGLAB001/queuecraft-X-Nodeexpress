# QueueCraft

## Description
QueueCraft is a real-time university queue management system built with Node.js and Express that coordinates student service desks for Library Assistance, IT Help Desk, and Student Administration. The application entry point is `server.js`, which binds to `0.0.0.0` on port `3000` (or `process.env.PORT`) and handles static asset delivery and reverse-proxy routing. Core domain logic in `services/queueService.js` manages FIFO queue operations, token transitions, and dashboard metrics. File persistence is managed by `services/storageService.js` using `data/queue-data.json`. Request validation is handled in `utils/validator.js`, and 1-based queue position and wait-time estimations are calculated in `utils/positionCalculator.js`. The vanilla JavaScript client in `public/app.js` drives the frontend dashboard and communicates with the Express REST API.

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
- Bug location: "services/queueService.js", within `callNextToken()` (line 82).
- How to observe it: Queue multiple waiting tokens (e.g. T-101, T-102) and trigger POST `/api/operator/call-next` or click "Call Next Token" in the operator console.
- Failure: The newest token is dequeued instead of the oldest because `waitingTokens[waitingTokens.length - 1]` is selected instead of `waitingTokens[0]`.
- Expected: Queue operations must strictly adhere to FIFO ordering by selecting `waitingTokens[0]`.

2. Zero-Indexed Queue Position Calculation
- Bug location: "utils/positionCalculator.js", within `calculateQueuePosition()` (line 28).
- How to observe it: Query GET `/api/tokens/:id/position` for a waiting token or create a token when the queue is empty.
- Failure: Returns the 0-based array index `index`, displaying queue position `#0` on the student ticket card instead of position `#1`.
- Expected: Queue positions must be 1-based, returning `index + 1` for waiting tokens.

3. Incomplete Validation for Token Creation
- Bug location: "utils/validator.js", within `validateTokenCreation()` (lines 23–25).
- How to observe it: Submit POST `/api/tokens` with an empty string `""` or whitespace `"   "` as `studentName`.
- Failure: The condition only checks `body.studentName === undefined`, allowing blank and whitespace-only strings to pass validation and generate active tokens.
- Expected: Reject empty and whitespace-only student names with HTTP 400 Bad Request and descriptive validation errors without creating a token.

4. Waiting Queue UI Desynchronization on Call Next
- Bug location: "public/app.js", within `handleCallNext()` (lines 318–320).
- How to observe it: Click "Call Next Token" in the operator console while students are listed in the Live Waiting Queue table.
- Failure: The Now Serving card updates, but `renderWaitingQueue(data.waitingTokens)` is not called, leaving the called student rendered in the waiting queue table until a manual page reload.
- Expected: Immediately update the waiting queue table by calling `renderWaitingQueue(data.waitingTokens)` after calling the next token.
