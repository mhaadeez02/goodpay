/**
 * GoodPay - In-App Dialog System
 * Replaces all native browser alert/confirm/prompt with beautiful in-app overlays
 * rendered INSIDE the mobile app screen container.
 */

function _ensureDialogContainer() {
  let container = document.getElementById('goodpayDialogContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'goodpayDialogContainer';
    container.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: dialogBgFadeIn 0.18s ease-out;
    `;
    document.body.appendChild(container);
  }
  return container;
}

function _removeDialogContainer() {
  const el = document.getElementById('goodpayDialogContainer');
  if (el) {
    el.style.animation = 'dialogBgFadeOut 0.15s ease-in forwards';
    setTimeout(() => el.remove(), 150);
  }
}

function _buildDialog({ icon, title, message, type = 'info', buttons }) {
  const colorMap = {
    info:    { border: 'rgba(0,240,255,0.35)',  icon: '💬', accent: '#00F0FF' },
    success: { border: 'rgba(0,230,118,0.4)',   icon: '✅', accent: '#00E676' },
    warning: { border: 'rgba(255,199,44,0.4)',  icon: '⚠️', accent: '#FFC72C' },
    danger:  { border: 'rgba(239,68,68,0.45)',  icon: '🚨', accent: '#F87171' },
    confirm: { border: 'rgba(56,189,248,0.35)', icon: '❓', accent: '#38BDF8' },
    input:   { border: 'rgba(0,240,255,0.35)',  icon: '✏️', accent: '#00F0FF' },
  };
  const theme = colorMap[type] || colorMap.info;
  const displayIcon = icon || theme.icon;

  const box = document.createElement('div');
  box.style.cssText = `
    background: linear-gradient(145deg, #0b1329, #0e1630);
    border: 1px solid ${theme.border};
    border-radius: 20px;
    padding: 1.75rem 1.5rem 1.35rem 1.5rem;
    max-width: 340px;
    width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 30px ${theme.border};
    animation: dialogSlideIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
    font-family: 'Outfit', 'Inter', sans-serif;
    color: #fff;
    text-align: center;
  `;

  box.innerHTML = `
    <div style="font-size: 2.4rem; margin-bottom: 0.6rem; line-height: 1;">${displayIcon}</div>
    ${title ? `<div style="font-weight: 800; font-size: 1.05rem; color: ${theme.accent}; margin-bottom: 0.5rem;">${title}</div>` : ''}
    <div style="font-size: 0.88rem; color: #CBD5E1; line-height: 1.55; margin-bottom: 1.25rem;">${message}</div>
    ${type === 'input' ? `<input id="goodpayDialogInput" type="text" autocomplete="off" style="
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 10px; padding: 0.65rem 0.9rem;
      color: #fff; font-size: 0.9rem; font-family: inherit;
      margin-bottom: 1rem; outline: none;
    ">` : ''}
    <div id="goodpayDialogButtons" style="display: flex; gap: 0.65rem; justify-content: center; flex-wrap: wrap;"></div>
  `;

  const btnContainer = box.querySelector('#goodpayDialogButtons');
  buttons.forEach(({ label, style, onClick }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      flex: 1; min-width: 90px; padding: 0.6rem 1rem;
      border-radius: 10px; border: none; cursor: pointer;
      font-weight: 700; font-size: 0.88rem;
      font-family: inherit; transition: all 0.15s ease;
      ${style}
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.03)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', onClick);
    btnContainer.appendChild(btn);
  });

  return box;
}

/** Show a simple alert dialog. Returns a Promise that resolves when dismissed. */
export function showAlert(message, { title = '', type = 'info', icon = '' } = {}) {
  return new Promise((resolve) => {
    const container = _ensureDialogContainer();
    const box = _buildDialog({
      icon, title, message, type,
      buttons: [{
        label: 'OK',
        style: `background: linear-gradient(135deg, #00c6ff, #0072ff); color: #fff; box-shadow: 0 4px 14px rgba(0,114,255,0.35);`,
        onClick: () => { _removeDialogContainer(); resolve(); }
      }]
    });
    container.innerHTML = '';
    container.appendChild(box);

    if (type === 'input') {
      setTimeout(() => document.getElementById('goodpayDialogInput')?.focus(), 50);
    }

    // Close on backdrop click
    container.addEventListener('click', (e) => {
      if (e.target === container) { _removeDialogContainer(); resolve(); }
    }, { once: true });
  });
}

/** Show a confirm dialog. Returns Promise<boolean>. */
export function showConfirm(message, { title = 'Confirm', type = 'confirm', icon = '' } = {}) {
  return new Promise((resolve) => {
    const container = _ensureDialogContainer();
    const box = _buildDialog({
      icon, title, message, type,
      buttons: [
        {
          label: 'Cancel',
          style: `background: rgba(255,255,255,0.07); color: #94A3B8; border: 1px solid rgba(255,255,255,0.12);`,
          onClick: () => { _removeDialogContainer(); resolve(false); }
        },
        {
          label: 'Confirm',
          style: `background: linear-gradient(135deg, #00c6ff, #0072ff); color: #fff; box-shadow: 0 4px 14px rgba(0,114,255,0.3);`,
          onClick: () => { _removeDialogContainer(); resolve(true); }
        }
      ]
    });
    container.innerHTML = '';
    container.appendChild(box);
  });
}

/** Confirm with a red destructive action button (for logout, delete, etc). */
export function showDangerConfirm(message, { title = 'Are you sure?', confirmLabel = 'Confirm', icon = '⚠️' } = {}) {
  return new Promise((resolve) => {
    const container = _ensureDialogContainer();
    const box = _buildDialog({
      icon, title, message, type: 'danger',
      buttons: [
        {
          label: 'Cancel',
          style: `background: rgba(255,255,255,0.07); color: #94A3B8; border: 1px solid rgba(255,255,255,0.12);`,
          onClick: () => { _removeDialogContainer(); resolve(false); }
        },
        {
          label: confirmLabel,
          style: `background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,0.4);`,
          onClick: () => { _removeDialogContainer(); resolve(true); }
        }
      ]
    });
    container.innerHTML = '';
    container.appendChild(box);
  });
}

/** Show an input prompt dialog. Returns Promise<string|null> (null = cancelled). */
export function showPrompt(message, { title = '', defaultValue = '', placeholder = '', icon = '' } = {}) {
  return new Promise((resolve) => {
    const container = _ensureDialogContainer();
    const box = _buildDialog({
      icon, title, message, type: 'input',
      buttons: [
        {
          label: 'Cancel',
          style: `background: rgba(255,255,255,0.07); color: #94A3B8; border: 1px solid rgba(255,255,255,0.12);`,
          onClick: () => { _removeDialogContainer(); resolve(null); }
        },
        {
          label: 'OK',
          style: `background: linear-gradient(135deg, #00c6ff, #0072ff); color: #fff; box-shadow: 0 4px 14px rgba(0,114,255,0.35);`,
          onClick: () => {
            const val = document.getElementById('goodpayDialogInput')?.value ?? '';
            _removeDialogContainer();
            resolve(val);
          }
        }
      ]
    });

    container.innerHTML = '';
    container.appendChild(box);

    const inputEl = box.querySelector('#goodpayDialogInput');
    if (inputEl) {
      inputEl.value = defaultValue;
      inputEl.placeholder = placeholder;
      setTimeout(() => inputEl.focus(), 60);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          _removeDialogContainer();
          resolve(inputEl.value);
        }
      });
    }
  });
}
