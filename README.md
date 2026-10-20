# QueueCraft — Smart Queue Management System

QueueCraft is a real-time queue management system designed for university service counters, including Library Assistance, IT Help Desk, and Student Administration. Students can generate service tickets and monitor their place in line, while staff operators manage the service window, call waiting students, and record completed sessions.

## 1. Application Overview

### Core Functionality
- Issue Service Tickets: Students select a service counter, provide their name and student identification, and receive a numbered digital ticket.
- Live Queue Tracking: Students monitor their current place in line and view estimated wait times on their personal ticket card.
- Now Serving Counter: A prominent digital counter displays the student currently being assisted at the service desk.
- Operator Console: Staff members can call the next eligible student to the counter and mark completed inquiries.
- Live Waiting Queue: Displays all waiting students in order of arrival with service counter tags and expected wait times.
- State Persistence & Reset: Queue data remains preserved across browser refreshes and can be restored to sample data at any time.

## 2. Debugging Challenge

QueueCraft contains four intentional defects affecting line ordering, ticket numbering, form validation, and operator screen updates. Candidates must investigate, reproduce, and fix all four issues to ensure that queue processing is fair, accurate, and properly reflected in the user interface.

### Reported Issues & Tasks:

Issue 1: Queue Serves Newest Students First Instead of Oldest
- User Symptom: When an operator calls the next student, the person who just joined the line gets called instead of the student who has been waiting the longest.
- Task: Ensure the service counter strictly follows First-In, First-Out order so that the earliest waiting student is always called next.

Issue 2: First Waiting Student Assigned Position Zero
- User Symptom: When a student receives the first ticket in the waiting line, their ticket card displays queue position #0 instead of position #1.
- Task: Correct the position calculation so that waiting positions start at 1 and accurately reflect each student's position in line.

Issue 3: Blank Student Names Allowed During Ticket Creation
- User Symptom: Submitting the ticket request form with an empty or whitespace name succeeds and creates an unnamed ticket in the queue.
- Task: Enforce form validation so that submissions with blank names are rejected with a clear error prompt and no ticket is issued.

Issue 4: Called Student Remains in Waiting List After Calling Next
- User Symptom: When the operator calls the next student, the counter display updates but the same student still appears in the waiting line table until the browser is manually refreshed.
- Task: Update the operator action so the waiting line table immediately refreshes and removes the called student without requiring a page reload.

## 3. Expected Behavior After Fixing Bugs

1. Calling the next ticket serves the earliest queued student in First-In, First-Out order.
2. Waiting positions start at #1 for the next student in line and increase sequentially.
3. Submitting empty or whitespace student names shows an error message and prevents ticket creation.
4. Calling the next student immediately removes them from the waiting list in the user interface.
