/**
 * QueueCraft Frontend Application Logic
 * Communicates with Express backend using relative API paths.
 */

// Relative base API path compatible with direct and preview proxy paths (/runtime/{id}/preview/)
const API_BASE = './api';

// Counter display names mapping
const COUNTER_NAMES = {
  library: 'Library Assistance',
  'it-help': 'IT Help Desk',
  admin: 'Student Administration'
};

// State
let myActiveTokenId = null;

// DOM Elements
const statServing = document.getElementById('stat-serving');
const statWaiting = document.getElementById('stat-waiting');
const statCompleted = document.getElementById('stat-completed');
const statTotal = document.getElementById('stat-total');

const servingEmpty = document.getElementById('serving-empty');
const servingActive = document.getElementById('serving-active');
const servingTokenId = document.getElementById('serving-token-id');
const servingStudentName = document.getElementById('serving-student-name');
const servingStudentId = document.getElementById('serving-student-id');
const servingCounterName = document.getElementById('serving-counter-name');
const servingTime = document.getElementById('serving-time');

const queueTbody = document.getElementById('queue-tbody');
const queueEmptyMessage = document.getElementById('queue-empty-message');
const waitingCountPill = document.getElementById('waiting-count-pill');

const tokenForm = document.getElementById('token-form');
const inputName = document.getElementById('student-name');
const inputId = document.getElementById('student-id');
const selectCounter = document.getElementById('service-counter');
const errorName = document.getElementById('error-name');
const errorId = document.getElementById('error-id');
const errorCounter = document.getElementById('error-counter');

const myTokenEmpty = document.getElementById('my-token-empty');
const myTokenDetails = document.getElementById('my-token-details');
const myTokenCounter = document.getElementById('my-token-counter');
const myTokenStatus = document.getElementById('my-token-status');
const myTokenId = document.getElementById('my-token-id');
const myTokenStudent = document.getElementById('my-token-student');
const myTokenPosition = document.getElementById('my-token-position');
const myTokenWait = document.getElementById('my-token-wait');

const btnCallNext = document.getElementById('btn-call-next');
const btnCompleteService = document.getElementById('btn-complete-service');
const btnRefresh = document.getElementById('btn-refresh');
const btnResetDemo = document.getElementById('btn-reset-demo');
const btnRefreshPosition = document.getElementById('btn-refresh-position');
const toastContainer = document.getElementById('toast-container');

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;" onclick="this.parentElement.remove()">&times;</button>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 4000);
}

/**
 * Renders Top Statistics Bar
 */
function renderStats(stats) {
  if (!stats) return;
  statServing.textContent = stats.totalServing ?? 0;
  statWaiting.textContent = stats.totalWaiting ?? 0;
  statCompleted.textContent = stats.totalCompleted ?? 0;
  statTotal.textContent = stats.totalToday ?? 0;
}

/**
 * Renders the Now Serving Panel
 */
function renderNowServing(token) {
  if (!token) {
    servingActive.classList.add('hidden');
    servingEmpty.classList.remove('hidden');
    return;
  }

  servingEmpty.classList.add('hidden');
  servingActive.classList.remove('hidden');

  servingTokenId.textContent = token.id;
  servingStudentName.textContent = token.studentName;
  servingStudentId.textContent = token.studentId;
  servingCounterName.textContent = COUNTER_NAMES[token.counter] || token.counter;

  if (token.servedAt) {
    const time = new Date(token.servedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    servingTime.textContent = `Serving since: ${time}`;
  } else {
    servingTime.textContent = 'Serving now';
  }
}

/**
 * Renders the Waiting Queue Table
 */
function renderWaitingQueue(waitingTokens = []) {
  waitingCountPill.textContent = `${waitingTokens.length} Waiting`;

  if (!waitingTokens || waitingTokens.length === 0) {
    queueTbody.innerHTML = '';
    queueEmptyMessage.classList.remove('hidden');
    return;
  }

  queueEmptyMessage.classList.add('hidden');
  queueTbody.innerHTML = waitingTokens
    .map((token, index) => {
      const waitMinutes = (index + 1) * 5;
      return `
        <tr data-token-id="${token.id}">
          <td class="queue-order-badge">#${index + 1}</td>
          <td class="queue-token-cell">${token.id}</td>
          <td class="queue-student-cell">
            <span class="queue-student-name">${token.studentName}</span>
            <span class="queue-student-id">${token.studentId}</span>
          </td>
          <td>
            <span class="badge badge-counter">${COUNTER_NAMES[token.counter] || token.counter}</span>
          </td>
          <td>
            <span class="ticket-status-badge status-waiting">WAITING</span>
          </td>
          <td style="color: #94a3b8;">~${waitMinutes} min</td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Renders the Student's Personal Ticket Card
 */
function renderMyToken(token, position, waitMinutes) {
  if (!token) {
    myTokenDetails.classList.add('hidden');
    myTokenEmpty.classList.remove('hidden');
    return;
  }

  myTokenEmpty.classList.add('hidden');
  myTokenDetails.classList.remove('hidden');

  myTokenId.textContent = token.id;
  myTokenStudent.textContent = `${token.studentName} (${token.studentId})`;
  myTokenCounter.textContent = COUNTER_NAMES[token.counter] || token.counter;

  const statusUpper = (token.status || 'WAITING').toUpperCase();
  myTokenStatus.textContent = statusUpper;
  myTokenStatus.className = `ticket-status-badge status-${token.status || 'waiting'}`;

  if (token.status === 'serving') {
    myTokenPosition.textContent = 'NOW!';
    myTokenPosition.style.color = '#34d399';
    myTokenWait.textContent = 'Proceed to counter';
  } else if (token.status === 'completed') {
    myTokenPosition.textContent = 'Done';
    myTokenPosition.style.color = '#94a3b8';
    myTokenWait.textContent = 'Service completed';
  } else {
    myTokenPosition.textContent = `#${position !== null && position !== undefined ? position : '-'}`;
    myTokenPosition.style.color = '#fbbf24';
    myTokenWait.textContent = waitMinutes !== undefined ? `~${waitMinutes} mins` : '~5 mins';
  }
}

/**
 * Fetches authoritative dashboard state from API
 */
async function loadDashboardState() {
  try {
    const res = await fetch(`${API_BASE}/queue`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data;

    renderStats(data.stats);
    renderNowServing(data.nowServing);
    renderWaitingQueue(data.waitingTokens);

    if (myActiveTokenId) {
      await updateMyTokenPosition(myActiveTokenId);
    }
  } catch (err) {
    console.error('Failed to load dashboard state:', err);
    showToast('Failed to sync queue data with server', 'error');
  }
}

/**
 * Checks position for a specific student token
 */
async function updateMyTokenPosition(tokenId) {
  try {
    const res = await fetch(`${API_BASE}/tokens/${encodeURIComponent(tokenId)}/position`);
    if (res.status === 404) {
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderMyToken(
      {
        id: data.tokenId,
        studentName: data.studentName,
        studentId: '',
        counter: data.counter,
        status: data.status
      },
      data.position,
      data.estimatedWaitMinutes
    );
  } catch (err) {
    console.error('Failed to check token position:', err);
  }
}

/**
 * Handle Student Token Creation
 */
async function handleGenerateToken(e) {
  e.preventDefault();

  // Reset errors
  errorName.textContent = '';
  errorId.textContent = '';
  errorCounter.textContent = '';

  const studentName = inputName.value;
  const studentId = inputId.value;
  const counter = selectCounter.value;

  try {
    const res = await fetch(`${API_BASE}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, studentId, counter })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach((msg) => {
          if (msg.toLowerCase().includes('name')) errorName.textContent = msg;
          else if (msg.toLowerCase().includes('id')) errorId.textContent = msg;
          else errorCounter.textContent = msg;
        });
        showToast(data.message || 'Validation failed', 'warning');
      } else {
        showToast(data.message || 'Failed to create token', 'error');
      }
      return;
    }

    myActiveTokenId = data.token.id;
    sessionStorage.setItem('queuecraft_active_token', myActiveTokenId);

    renderMyToken(data.token, data.position, data.estimatedWaitMinutes);
    showToast(`Token ${data.token.id} created! You are position #${data.position}.`, 'success');

    // Reset inputs
    inputName.value = '';
    inputId.value = '';

    await loadDashboardState();
  } catch (err) {
    console.error('Error generating token:', err);
    showToast('Network error while generating token', 'error');
  }
}

/**
 * Handle Operator: Call Next Token
 */
async function handleCallNext() {
  try {
    btnCallNext.disabled = true;
    const res = await fetch(`${API_BASE}/operator/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message || 'No students in waiting queue', 'warning');
      return;
    }

    showToast(`Now Serving: ${data.token.id} (${data.token.studentName})`, 'success');

    // Update the Now Serving card
    renderNowServing(data.nowServing);

    // Update the stats bar
    renderStats(data.stats);

    // BUG 4 (Intentional): Frontend state synchronization defect
    // Does NOT synchronize the waiting queue table or count pill after calling next token!
    // As a result, the student who was just called still appears in the waiting table
    // until a full page reload occurs.
    // Correct implementation:
    // renderWaitingQueue(data.waitingTokens);

    if (myActiveTokenId) {
      await updateMyTokenPosition(myActiveTokenId);
    }
  } catch (err) {
    console.error('Error calling next token:', err);
    showToast('Failed to call next token', 'error');
  } finally {
    btnCallNext.disabled = false;
  }
}

/**
 * Handle Operator: Complete Service
 */
async function handleCompleteService() {
  try {
    btnCompleteService.disabled = true;
    const res = await fetch(`${API_BASE}/operator/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'No active service to complete', 'warning');
      return;
    }

    showToast(`Service for ${data.completedToken.id} marked as completed`, 'success');

    // Authoritative update
    renderNowServing(null);
    renderWaitingQueue(data.waitingTokens);
    renderStats(data.stats);

    if (myActiveTokenId) {
      await updateMyTokenPosition(myActiveTokenId);
    }
  } catch (err) {
    console.error('Error completing service:', err);
    showToast('Failed to complete service', 'error');
  } finally {
    btnCompleteService.disabled = false;
  }
}

/**
 * Handle Reset Demo Data
 */
async function handleResetDemo() {
  if (!confirm('Are you sure you want to reset all queue data to demo fixtures?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      myActiveTokenId = null;
      sessionStorage.removeItem('queuecraft_active_token');
      renderMyToken(null);
      showToast('Demo data reset successfully', 'info');
      await loadDashboardState();
    }
  } catch (err) {
    showToast('Failed to reset demo data', 'error');
  }
}

// Event Listeners
tokenForm.addEventListener('submit', handleGenerateToken);
btnCallNext.addEventListener('click', handleCallNext);
btnCompleteService.addEventListener('click', handleCompleteService);
btnRefresh.addEventListener('click', loadDashboardState);
btnResetDemo.addEventListener('click', handleResetDemo);
btnRefreshPosition.addEventListener('click', () => {
  if (myActiveTokenId) updateMyTokenPosition(myActiveTokenId);
});

// Initialize session state
const savedToken = sessionStorage.getItem('queuecraft_active_token');
if (savedToken) {
  myActiveTokenId = savedToken;
}

// Initial load
loadDashboardState();
