// ================================================================
// bugreport.js — In-Game Bug Reporter
// Saves reports to localStorage with full game state snapshot
// Descent into Eternity
// ================================================================

const BUG_STORAGE_KEY = 'die_bug_reports';
let _bugCategory = 'Combat';

// ── Open / Close ─────────────────────────────────────────────
function openBugReporter() {
  const panel = document.getElementById('bugReportPanel');
  const ctx   = document.getElementById('bugContextLabel');
  const desc  = document.getElementById('bugDesc');
  const msg   = document.getElementById('bugSubmitMsg');
  const copyMsg = document.getElementById('bugCopyMsg');
  const countEl = document.getElementById('bugReportCount');
  if (!panel) return;

  // Snapshot context label
  if (ctx) ctx.textContent = _buildContextString();

  // Reset form
  if (desc) desc.value = '';
  if (msg)  msg.style.display = 'none';
  if (copyMsg) copyMsg.style.display = 'none';
  _bugCategory = 'Combat';
  document.querySelectorAll('.bug-cat-btn').forEach(b => b.classList.remove('active'));
  const first = document.querySelector('.bug-cat-btn');
  if (first) first.classList.add('active');

  // Show report count
  if (countEl) {
    try {
      const saved = JSON.parse(localStorage.getItem(BUG_STORAGE_KEY) || '[]');
      countEl.textContent = saved.length + ' report' + (saved.length !== 1 ? 's' : '') + ' saved';
    } catch(e) { countEl.textContent = '0 reports saved'; }
  }

  panel.style.display = 'flex';
  if (desc) desc.focus();
}

function closeBugReporter() {
  const panel = document.getElementById('bugReportPanel');
  if (panel) panel.style.display = 'none';
}

// ── Copy all reports to clipboard ────────────────────────────
function copyBugReports() {
  try {
    const reports = JSON.parse(localStorage.getItem(BUG_STORAGE_KEY) || '[]');
    const copyMsg = document.getElementById('bugCopyMsg');
    const copyBtn = document.getElementById('bugCopyBtn');
    if (!reports.length) {
      if (copyMsg) { copyMsg.textContent = '⚠ No reports yet!'; copyMsg.style.display = 'block'; setTimeout(() => { copyMsg.style.display = 'none'; copyMsg.textContent = '✅ Copied! Paste it to Claude.'; }, 1500); }
      return;
    }
    const text = JSON.stringify(reports, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      if (copyMsg) { copyMsg.style.display = 'block'; setTimeout(() => copyMsg.style.display = 'none', 2500); }
      if (copyBtn) { copyBtn.textContent = '✅ COPIED!'; setTimeout(() => copyBtn.textContent = '📋 COPY ALL REPORTS', 2500); }
    }).catch(() => {
      // Fallback for browsers that block clipboard
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (copyMsg) { copyMsg.style.display = 'block'; setTimeout(() => copyMsg.style.display = 'none', 2500); }
      if (copyBtn) { copyBtn.textContent = '✅ COPIED!'; setTimeout(() => copyBtn.textContent = '📋 COPY ALL REPORTS', 2500); }
    });
  } catch(e) { console.error('Copy failed:', e); }
}

// ── Category selection ────────────────────────────────────────
function selectBugCategory(btn) {
  document.querySelectorAll('.bug-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _bugCategory = btn.dataset.cat;
}

// ── Build a readable context string ──────────────────────────
function _buildContextString() {
  if (!G) return 'On title screen / no active game.';
  const zone  = (typeof ZONES !== 'undefined' && ZONES[G.zoneIdx]) ? ZONES[G.zoneIdx].name : '?';
  const cls   = (typeof CLASSES !== 'undefined' && CLASSES[G.classId]) ? CLASSES[G.classId].name : G.classId;
  const enemy = G.currentEnemy ? G.currentEnemy.name + ' (' + Math.ceil(G.currentEnemy.hp) + '/' + G.currentEnemy.maxHp + ' HP)' : 'None';
  return cls + ' | Lv.' + G.level + ' | Zone: ' + zone + ' | HP: ' + G.hp + '/' + G.maxHp + ' | Enemy: ' + enemy;
}

// ── Grab last N battle log lines ─────────────────────────────
function _getRecentLog(n) {
  try {
    const logEl = document.getElementById('battleLog');
    if (!logEl) return [];
    const entries = logEl.querySelectorAll('.log-entry, div, p, span');
    const lines = [];
    entries.forEach(el => { if (el.textContent.trim()) lines.push(el.textContent.trim()); });
    return lines.slice(-n);
  } catch(e) { return []; }
}

// ── Build full game state snapshot ───────────────────────────
function _buildSnapshot() {
  if (!G) return { screen: 'title' };
  return {
    classId:        G.classId,
    level:          G.level,
    hp:             G.hp,
    maxHp:          G.maxHp,
    res:            G.res,
    resMax:         G.resMax,
    zoneIdx:        G.zoneIdx,
    zoneKills:      G.zoneKills,
    dungeonFights:  G.dungeonFights,
    campUnlocked:   G.campUnlocked,
    bossReady:      G.bossReady,
    bossDefeated:   G.bossDefeated,
    difficulty:     G.difficulty,
    hardcore:       G.hardcore,
    talents:        G.talents,
    subclassUnlocked: G.subclassUnlocked,
    conditions:     G.conditions,
    isPlayerTurn:   G.isPlayerTurn,
    actionUsed:     G.actionUsed,
    bonusUsed:      G.bonusUsed,
    currentEnemy:   G.currentEnemy ? {
      name: G.currentEnemy.name,
      hp:   G.currentEnemy.hp,
      maxHp: G.currentEnemy.maxHp,
      isBoss: G.currentEnemy.isBoss,
      phaseTriggered: G.currentEnemy.phaseTriggered
    } : null,
    equipped:       G.equipped,
    gold:           G.gold,
    totalKills:     G.totalKills,
    recentLog:      _getRecentLog(10),
  };
}

// ── Submit ────────────────────────────────────────────────────
function submitBugReport() {
  const desc    = document.getElementById('bugDesc');
  const msg     = document.getElementById('bugSubmitMsg');
  const descVal = desc ? desc.value.trim() : '';

  if (!descVal) {
    if (desc) { desc.style.borderColor = '#cc2222'; setTimeout(() => desc.style.borderColor = '', 1000); }
    return;
  }

  const report = {
    id:          Date.now(),
    timestamp:   new Date().toLocaleString(),
    category:    _bugCategory,
    description: descVal,
    context:     _buildContextString(),
    snapshot:    _buildSnapshot(),
    resolved:    false,
  };

  // Load existing, push new, save
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(BUG_STORAGE_KEY) || '[]'); } catch(e) {}
  reports.push(report);
  localStorage.setItem(BUG_STORAGE_KEY, JSON.stringify(reports));

  // Show confirmation
  if (desc) desc.value = '';
  if (msg)  { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; closeBugReporter(); }, 1800); }

  console.log('[BugReporter] Report #' + report.id + ' saved.', report);
}

// ── Dev utility: call getBugReports() in console to read all ──
function getBugReports() {
  try {
    const reports = JSON.parse(localStorage.getItem(BUG_STORAGE_KEY) || '[]');
    if (!reports.length) { console.log('No bug reports found.'); return []; }
    console.group('🐛 Bug Reports (' + reports.length + ' total)');
    reports.forEach((r, i) => {
      console.group('#' + (i+1) + ' [' + r.category + '] ' + r.timestamp + (r.resolved ? ' ✅ RESOLVED' : ''));
      console.log('Description:', r.description);
      console.log('Context:', r.context);
      console.log('Snapshot:', r.snapshot);
      console.groupEnd();
    });
    console.groupEnd();
    return reports;
  } catch(e) { console.error('Failed to read bug reports:', e); return []; }
}

function clearBugReports() {
  localStorage.removeItem(BUG_STORAGE_KEY);
  console.log('[BugReporter] All reports cleared.');
}

function clearBugReportsUI() {
  clearBugReports();
  updateBugCount();
  const msg = document.getElementById('bugClearMsg');
  if(msg){ msg.style.display='block'; setTimeout(()=>msg.style.display='none', 2000); }
}

// Expose to console
window.getBugReports  = getBugReports;
window.clearBugReports = clearBugReports;

// Close panel on backdrop click
document.addEventListener('click', function(e) {
  const panel = document.getElementById('bugReportPanel');
  const btn   = document.getElementById('bugReportBtn');
  if (panel && panel.style.display !== 'none') {
    if (!panel.contains(e.target) && e.target !== btn) {
      closeBugReporter();
    }
  }
});
