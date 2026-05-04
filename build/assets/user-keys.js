// ============================================================
//  user-keys.js — "My Sources of Truth" settings drawer.
//
//  Lets visitors supply their own RPC URLs (per chain) and an Etherscan
//  multichain V2 API key. Keys are stored in localStorage only, never
//  sent anywhere. The site has no backend.
//
//  Integration:
//    - Header button #user-keys-btn opens the drawer.
//    - rpcsFor() in index.html prepends window.__userKeys.getRpcForChain(key)
//      to the fallback list when set, falling back to public RPCs otherwise.
//    - window.__userKeys.getExplorerKey() returns the saved Etherscan key
//      (currently nothing on the site consumes this — reserved for future
//      explorer-API features so we don't have to ask twice).
// ============================================================

(function () {
  const STORAGE_KEY = 'rkl.userKeys';

  const CHAIN_IDS = {
    ETH:    1,
    BSC:    56,
    POL:    137,
    GNO:    100,
    ARB:    42161,
    BASE:   8453,
    STABLE: 988,
  };

  const CHAIN_LABELS = {
    ETH:    'Ethereum',
    BSC:    'BNB Smart Chain',
    POL:    'Polygon',
    GNO:    'Gnosis',
    ARB:    'Arbitrum',
    BASE:   'Base',
    STABLE: 'Stable',
  };

  // ─── Storage layer ───────────────────────────────────────────────

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { rpcUrls: {}, explorerKey: '' };
      const p = JSON.parse(raw);
      return {
        rpcUrls: p.rpcUrls && typeof p.rpcUrls === 'object' ? p.rpcUrls : {},
        explorerKey: typeof p.explorerKey === 'string' ? p.explorerKey : '',
      };
    } catch { return { rpcUrls: {}, explorerKey: '' }; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('user-keys save failed:', e); }
  }

  function clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  // ─── Public accessors (consumed by index.html and future scripts) ─

  function getRpcForChain(chain) {
    const url = load().rpcUrls[chain];
    return (url && /^https?:\/\//i.test(url)) ? url : null;
  }

  function getExplorerKey() {
    const k = load().explorerKey;
    return k || null;
  }

  function hasAnyKey() {
    const d = load();
    return !!d.explorerKey || Object.values(d.rpcUrls).some(v => v && v.length > 0);
  }

  window.__userKeys = { getRpcForChain, getExplorerKey, hasAnyKey };

  // ─── Validation probes ───────────────────────────────────────────

  async function testRpc(url, expectedChainId) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      });
      if (!r.ok) return { ok: false, msg: 'HTTP ' + r.status };
      const j = await r.json();
      if (j.error) return { ok: false, msg: j.error.message || 'RPC error' };
      const cid = parseInt(j.result, 16);
      if (!cid) return { ok: false, msg: 'No chainId returned' };
      if (cid !== expectedChainId) return { ok: false, msg: 'Chain mismatch · got ' + cid + ', expected ' + expectedChainId };
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message || 'Network error' };
    }
  }

  // Etherscan multichain V2 — test against ETH stats.ethsupply (free tier
  // covers ETH so this works regardless of whether the user has paid for
  // BSC/Base access). Returns { ok, msg } so the UI can show a clear hint.
  async function testExplorerKey(key) {
    try {
      const url = 'https://api.etherscan.io/v2/api?chainid=1&module=stats&action=ethsupply&apikey=' + encodeURIComponent(key);
      const r = await fetch(url);
      if (!r.ok) return { ok: false, msg: 'HTTP ' + r.status };
      const j = await r.json();
      if (j.status === '1' || j.message === 'OK') return { ok: true };
      return { ok: false, msg: j.result || j.message || 'Invalid key' };
    } catch (e) {
      return { ok: false, msg: e.message || 'Network error' };
    }
  }

  // ─── UI helpers ──────────────────────────────────────────────────

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function flashStatus(btn, msg, ms) {
    const orig = btn.textContent;
    const wasDisabled = btn.disabled;
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = wasDisabled; }, ms || 1200);
  }

  function setStatus(el, kind, text, title) {
    el.className = 'uk-status' + (kind ? ' uk-' + kind : '');
    el.textContent = text || '';
    el.title = title || '';
  }

  // ─── Indicator dot on header button ──────────────────────────────

  function refreshIndicator() {
    const btn = document.getElementById('user-keys-btn');
    if (!btn) return;
    btn.classList.toggle('has-keys', hasAnyKey());
  }

  // ─── Drawer UI ───────────────────────────────────────────────────

  function ensureRoot() {
    let root = document.getElementById('user-keys-drawer');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'user-keys-drawer';
    root.className = 'uk-drawer';
    document.body.appendChild(root);
    return root;
  }

  function buildDrawer() {
    const root = ensureRoot();
    const data = load();

    let rpcRows = '';
    for (const chain of Object.keys(CHAIN_IDS)) {
      const url = data.rpcUrls[chain] || '';
      rpcRows +=
        '<div class="uk-row">' +
          '<label class="uk-label">' + CHAIN_LABELS[chain] +
            '<small>chain ' + CHAIN_IDS[chain] + '</small>' +
          '</label>' +
          '<input type="text" class="uk-input" data-chain="' + chain + '" placeholder="https://..." value="' + escapeHtml(url) + '" spellcheck="false" autocomplete="off">' +
          '<span class="uk-status" data-chain-status="' + chain + '"></span>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="uk-backdrop"></div>' +
      '<div class="uk-panel" role="dialog" aria-labelledby="uk-title">' +
        '<div class="uk-header">' +
          '<h3 id="uk-title">My Sources of Truth</h3>' +
          '<button class="uk-close" aria-label="Close">×</button>' +
        '</div>' +
        '<p class="uk-blurb">' +
          'The site reads pre-built audit JSON for historical data and verifies it live against the chain. ' +
          'Set keys here to make verification fast and self-sovereign — keys are stored in your browser only, ' +
          'never sent to any server (this site has no backend). Source is open: verify in DevTools or on GitHub.' +
        '</p>' +

        '<div class="uk-section">' +
          '<h4>Etherscan Multichain V2 API Key</h4>' +
          '<p class="uk-section-help">' +
            'Primary path for verifying audit data. A free Etherscan key covers ETH, Polygon, Gnosis, and Arbitrum. ' +
            'Without one, the site falls back to RPC for verification — slower but still works.' +
          '</p>' +
          '<div class="uk-row">' +
            '<label class="uk-label">Etherscan V2<small>free tier: ETH/POL/GNO/ARB · paid: also BSC/Base</small></label>' +
            '<input type="text" class="uk-input" id="uk-explorer-key" placeholder="ABC123..." value="' + escapeHtml(data.explorerKey || '') + '" spellcheck="false" autocomplete="off">' +
            '<span class="uk-status" id="uk-explorer-status"></span>' +
          '</div>' +
        '</div>' +

        '<div class="uk-section">' +
          '<h4>RPC Endpoints</h4>' +
          '<p class="uk-section-help">' +
            'Optional. Used for live state (balances, pool reserves, vault stats) and as a fallback when explorer ' +
            'access is unavailable for a chain. Most useful for BSC if you do not have a paid Etherscan tier.' +
          '</p>' +
          rpcRows +
        '</div>' +

        '<div class="uk-actions">' +
          '<button class="cta sm" id="uk-test">Test all</button>' +
          '<button class="cta sm" id="uk-save">Save</button>' +
          '<button class="cta sm" id="uk-clear">Clear all</button>' +
        '</div>' +

        '<p class="uk-footer">' +
          'Verification flow: 1) explorer API with your key, 2) your RPC if no explorer access for that chain, ' +
          '3) public RPC as last resort. Default visitors with no keys still get the audit JSON instantly; ' +
          'verification just runs slower on public RPCs.' +
        '</p>' +
      '</div>';

    // Wire close
    root.querySelector('.uk-backdrop').onclick = closeDrawer;
    root.querySelector('.uk-close').onclick = closeDrawer;

    // Wire save
    root.querySelector('#uk-save').onclick = () => {
      const out = { rpcUrls: {}, explorerKey: '' };
      root.querySelectorAll('.uk-input[data-chain]').forEach(inp => {
        const v = inp.value.trim();
        if (v) out.rpcUrls[inp.dataset.chain] = v;
      });
      const k = root.querySelector('#uk-explorer-key').value.trim();
      if (k) out.explorerKey = k;
      save(out);
      refreshIndicator();
      flashStatus(root.querySelector('#uk-save'), 'Saved ✓');
    };

    // Wire clear
    root.querySelector('#uk-clear').onclick = () => {
      if (!confirm('Clear all stored keys? This cannot be undone.')) return;
      clearAll();
      refreshIndicator();
      buildDrawer();
    };

    // Wire test
    root.querySelector('#uk-test').onclick = async () => {
      const btn = root.querySelector('#uk-test');
      btn.disabled = true;
      const origLabel = btn.textContent;
      btn.textContent = 'Testing…';

      // Test each populated RPC sequentially (cheaper on user's network).
      for (const inp of root.querySelectorAll('.uk-input[data-chain]')) {
        const url = inp.value.trim();
        const chain = inp.dataset.chain;
        const status = root.querySelector('[data-chain-status="' + chain + '"]');
        if (!url) { setStatus(status, '', '', ''); continue; }
        setStatus(status, 'checking', '⋯', 'Probing…');
        const r = await testRpc(url, CHAIN_IDS[chain]);
        if (r.ok) setStatus(status, 'ok', '✓', 'Reachable, chain ID matches');
        else      setStatus(status, 'err', '✗', r.msg);
      }

      // Test explorer key
      const k = root.querySelector('#uk-explorer-key').value.trim();
      const ks = root.querySelector('#uk-explorer-status');
      if (!k) {
        setStatus(ks, '', '', '');
      } else {
        setStatus(ks, 'checking', '⋯', 'Probing…');
        const r = await testExplorerKey(k);
        if (r.ok) setStatus(ks, 'ok', '✓', 'Etherscan accepted the key');
        else      setStatus(ks, 'err', '✗', r.msg);
      }

      btn.disabled = false;
      btn.textContent = origLabel;
    };
  }

  function openDrawer() {
    const root = ensureRoot();
    if (!root.firstChild) buildDrawer();
    else buildDrawer();   // rebuild so values reflect current storage
    root.classList.add('uk-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const root = document.getElementById('user-keys-drawer');
    if (root) root.classList.remove('uk-open');
    document.body.style.overflow = '';
  }

  window.__userKeysOpen = openDrawer;
  window.__userKeysClose = closeDrawer;

  // ─── Init ────────────────────────────────────────────────────────

  function init() {
    refreshIndicator();
    const btn = document.getElementById('user-keys-btn');
    if (btn) btn.addEventListener('click', openDrawer);
    // ESC key closes the drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
