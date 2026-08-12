import { store } from './store.js';
import { renderVisaCard, attachVisaCardEvents } from './components/visaCard.js';
import { renderMfsDepositView, attachMfsDepositEvents } from './components/deposit.js';
import { renderSupportedMerchantIcons } from './components/merchants.js';
import { renderAuthScreen, attachAuthEvents } from './components/auth.js';
import { showAlert, showConfirm, showDangerConfirm, showPrompt } from './components/dialog.js';

let mobileTab = 'home';
let isDeviceFrameMode = true;
let isPasswordChangeExpanded = false;
let isEmailChangeExpanded = false;

// Toast Notification Helper
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span><div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Render Top Navbar
function renderNavbar() {
  const currentUser = store.getCurrentUser();
  const navContainer = document.getElementById('navbarContainer');
  if (!navContainer) return;

  if (!currentUser) {
    navContainer.innerHTML = `
      <div class="brand-logo" id="brandLogoBtn" style="cursor: pointer;">
        <div class="brand-icon">G</div>
        <div class="brand-name">Good<span>Pay</span></div>
      </div>
      <div class="nav-links">
        <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 240, 255, 0.1); padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(0, 240, 255, 0.25);">
          🛡️ Visa Portal
        </div>
      </div>
    `;
    return;
  }

  const userCards = store.getCards(currentUser.id);
  const activeCard = userCards[0];
  const displayCardBalance = activeCard ? activeCard.balanceUSD : (currentUser.balanceUSD || 0);

  const navHtml = `
    <div class="brand-logo" id="brandLogoBtn" style="cursor: pointer;">
      <div class="brand-icon">G</div>
      <div class="brand-name">Good<span>Pay</span></div>
    </div>

    <div class="nav-links">


    </div>
  `;

  navContainer.innerHTML = navHtml;
  attachNavbarEvents();
}

function attachNavbarEvents() {
  document.getElementById('brandLogoBtn')?.addEventListener('click', () => {
    mobileTab = 'home';
    renderApp();
  });

}

function renderMainContent() {
  const mainContainer = document.getElementById('mainContentContainer');
  if (!mainContainer) return;

  if (!store.isLoggedIn()) {
    mainContainer.innerHTML = `
      <div style="margin-bottom:1rem;">
        
        <!-- Frame View Mode Selector -->
        <div class="device-toggle-bar">
          <button class="device-toggle-btn ${isDeviceFrameMode ? 'active' : ''}" id="btnToggleAuthFrameOn">
            📱 Smartphone App View
          </button>
          <button class="device-toggle-btn ${!isDeviceFrameMode ? 'active' : ''}" id="btnToggleAuthFrameOff">
            💻 Fullscreen Responsive
          </button>
        </div>

        <!-- SMARTPHONE APP CONTAINER -->
        <div class="mobile-app-wrapper ${!isDeviceFrameMode ? 'fullscreen' : ''}">
          
          ${isDeviceFrameMode ? `
            <div class="mobile-notch">
              <div class="mobile-notch-camera"></div>
            </div>
          ` : ''}

          ${renderAuthScreen('login')}

        </div>
      </div>
    `;

    document.getElementById('btnToggleAuthFrameOn')?.addEventListener('click', () => {
      isDeviceFrameMode = true;
      renderMainContent();
    });
    document.getElementById('btnToggleAuthFrameOff')?.addEventListener('click', () => {
      isDeviceFrameMode = false;
      renderMainContent();
    });

    attachAuthEvents(store, showToast, () => {
      mobileTab = 'home';
      renderApp();
    });
    return;
  }

  mainContainer.innerHTML = renderRemodeledMobileApp();
  attachRemodeledMobileEvents();
}

// 1. MOBILE APP VIEW (Home/Card, Recharge, Transaction, Profile)
function renderRemodeledMobileApp() {
  const user = store.getCurrentUser();
  const userCards = store.getCards(user.id);
  const userTxs = store.getTransactions(user.id);
  const settings = store.getSettings();

  const hasCard = userCards.length >= 1;
  const activeCard = userCards[0];
  const displayCardBalance = activeCard ? activeCard.balanceUSD : user.balanceUSD;

  return `
    <div style="margin-bottom:1rem;">
      
      <!-- Frame View Mode Selector -->
      <div class="device-toggle-bar">
        <button class="device-toggle-btn ${isDeviceFrameMode ? 'active' : ''}" id="btnToggleFrameOn">
          📱 Smartphone App View
        </button>
        <button class="device-toggle-btn ${!isDeviceFrameMode ? 'active' : ''}" id="btnToggleFrameOff">
          💻 Fullscreen Responsive
        </button>
      </div>

      <!-- SMARTPHONE APP CONTAINER -->
      <div class="mobile-app-wrapper ${!isDeviceFrameMode ? 'fullscreen' : ''}">
        
        ${isDeviceFrameMode ? `
          <div class="mobile-notch">
            <div class="mobile-notch-camera"></div>
          </div>
        ` : ''}

        <!-- MOBILE TOP HEADER (NAME, AVATAR & VERIFIED STATUS ARE PRESERVED HERE) -->
        <div class="mobile-app-header">
          <div class="mobile-user-info">
            <div class="user-avatar">${user.name.charAt(0)}</div>
            <div>
              <div class="mobile-greeting">Welcome back,</div>
              <div class="mobile-user-name">${user.name}</div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge ${user.kycStatus.toLowerCase()}" style="font-size:0.65rem;">
              ${user.kycStatus}
            </span>
          </div>
        </div>

        <div style="padding-bottom: 80px;">
          
          <!-- TAB 1: HOME / CARD PAGE -->
          <div id="mobTabContentHome" style="${mobileTab === 'home' ? 'display:block' : 'display:none'}; padding: 1.25rem;">
            
            <!-- CARD BALANCE CARD -->
            <div class="mobile-balance-card">
              <div class="mobile-balance-label">CARD BALANCE</div>
              <div class="mobile-balance-amount">$${displayCardBalance.toFixed(2)}</div>
              <div class="mobile-balance-bdt">≈ ৳${(displayCardBalance * settings.exchangeRateBDT).toLocaleString()} BDT</div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="font-size:1.15rem; color:#fff;">GoodPay Visa Card</h3>
              ${hasCard ? (() => {
                const cardStatus = userCards[0].status;
                if (cardStatus === 'INACTIVE' || cardStatus === 'UNPURCHASED') {
                  return `<span class="badge rejected" style="font-size:0.72rem;">🔒 Inactive</span>`;
                } else if (cardStatus === 'PROCESSING') {
                  return `<span class="badge pending" style="font-size:0.72rem;">⏳ Activating</span>`;
                } else {
                  return `<span class="badge approved" style="font-size:0.72rem;">1 Card Active</span>`;
                }
              })() : `
                <button class="btn-gold" id="mobBtnOrderNewCardHome" style="font-size:0.75rem; padding:0.4rem 0.8rem;">
                  ➕ Request Card
                </button>
              `}
            </div>

            ${!hasCard ? `
              <div class="glass-card" style="text-align:center; padding:2rem;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">
                  You do not have a Visa card yet. Each account is allowed <strong>1 Visa Card maximum</strong>.
                </p>
                <button class="btn-gold" id="mobBtnOrderFirstCardHome">Order Virtual Visa Card ($5.00)</button>
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:1.25rem;">
                ${renderVisaCard(userCards[0])}
                ${renderSupportedMerchantIcons()}
              </div>
            `}
          </div>

          <!-- TAB 2: RECHARGE PAGE -->
          <div id="mobTabContentRecharge" style="${mobileTab === 'recharge' ? 'display:block' : 'display:none'}; padding: 1.25rem;">
            ${renderMfsDepositView(store, user)}
          </div>

          <!-- TAB 3: TRANSACTION (ALL TRANSACTIONS & DEPOSIT LOGS) -->
          <div id="mobTabContentTransaction" style="${mobileTab === 'transaction' ? 'display:block' : 'display:none'}; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="font-size:1.15rem; color:#fff;">All Transactions & Deposits</h3>
              <span class="badge approved" style="font-size:0.7rem;">${userTxs.length} Total</span>
            </div>
            
            ${userTxs.length === 0 ? `
              <div class="glass-card" style="text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.85rem;">
                No transactions or deposits recorded yet.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                ${userTxs.map(tx => `
                  <div class="glass-card" style="padding:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <div>
                        <div style="font-weight:700; color:#fff; font-size:0.95rem;">${tx.title}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${tx.details || '-'}</div>
                      </div>
                      <div style="font-family:var(--font-heading); font-weight:800; font-size:1.1rem; color:${tx.amountUSD >= 0 ? 'var(--accent-green)' : '#F87171'}">
                        ${tx.amountUSD >= 0 ? '+' : ''}$${tx.amountUSD.toFixed(2)}
                      </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; font-size:0.75rem; color:var(--text-dim);">
                      <span>${tx.date}</span>
                      <span class="badge ${tx.status === 'SUCCESS' ? 'approved' : (tx.status === 'PENDING' ? 'pending' : 'rejected')}">${tx.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- TAB 4: PROFILE PAGE (FULL PROFILE DETAILS & LOGOUT) -->
          <div id="mobTabContentProfile" style="${mobileTab === 'profile' ? 'display:block' : 'display:none'}; padding: 1.25rem;">
            
            <!-- 0. USER PROFILE HEADER CARD -->
            <div class="glass-card" style="margin-bottom:1.25rem; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.12);">
              <div style="display: flex; align-items: center; gap: 0.9rem;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; box-shadow: 0 4px 12px rgba(0, 240, 255, 0.25);">
                  ${user.name.charAt(0)}
                </div>
                <div>
                  <div style="font-weight: 800; color: #fff; font-size: 1.05rem; line-height: 1.2;">${user.name}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${user.phone || user.email}</div>
                  <div style="margin-top: 4px;">
                    <span class="badge ${user.kycStatus.toLowerCase()}" style="font-size: 0.65rem;">
                      <i class="fa-solid fa-circle-check"></i> ${user.kycStatus} Account
                    </span>
                  </div>
                </div>
              </div>
              <button onclick="window.handleUserLogout()" title="Log Out" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #ef4444; border-radius: 10px; padding: 7px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                🚪 Logout
              </button>
            </div>

            <!-- 1. COLLAPSIBLE CHANGE EMAIL ACCORDION -->
            <div class="glass-card" style="margin-bottom:1.25rem; transition:all 0.3s ease;">
              <div id="btnToggleEmailAccordion" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(0, 240, 255, 0.15); display:flex; align-items:center; justify-content:center; color:var(--accent-cyan); font-size:1.1rem;">
                    📧
                  </div>
                  <div>
                    <div style="font-weight:700; color:#fff; font-size:0.95rem;">Change Email</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${user.email}</div>
                  </div>
                </div>
                <div id="emailAccordionArrow" style="color:var(--accent-cyan); font-size:0.85rem; font-weight:700; padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.1); border-radius:6px;">
                  ${isEmailChangeExpanded ? '▲ Collapse' : '▼ Expand'}
                </div>
              </div>

              <!-- Collapsible Email Body -->
              <div id="emailAccordionBody" style="${isEmailChangeExpanded ? 'display:block' : 'display:none'}; margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-glass);">
                <form id="mobChangeEmailForm">
                  <div class="form-group">
                    <label class="form-label">New Email Address</label>
                    <input type="email" class="form-input" id="inputNewEmail" placeholder="e.g. new.email@gmail.com" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Current Password (for security)</label>
                    <input type="password" class="form-input" id="inputEmailConfirmPass" placeholder="Enter your password" required />
                  </div>

                  <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:0.75rem;">
                    💾 Save New Email
                  </button>
                </form>
              </div>
            </div>

            <!-- 2. COLLAPSIBLE CHANGE PASSWORD ACCORDION -->
            <div class="glass-card" style="margin-bottom:1.25rem; transition:all 0.3s ease;">
              <div id="btnTogglePasswordAccordion" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <div style="width:38px; height:38px; border-radius:10px; background:rgba(255, 184, 0, 0.15); display:flex; align-items:center; justify-content:center; color:var(--accent-gold); font-size:1.1rem;">
                    🔒
                  </div>
                  <div>
                    <div style="font-weight:700; color:#fff; font-size:0.95rem;">Change Password</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Update account login security</div>
                  </div>
                </div>
                <div id="passwordAccordionArrow" style="color:var(--accent-gold); font-size:0.85rem; font-weight:700; padding:0.25rem 0.5rem; background:rgba(255, 184, 0, 0.1); border-radius:6px;">
                  ${isPasswordChangeExpanded ? '▲ Collapse' : '▼ Expand'}
                </div>
              </div>

              <!-- Collapsible Password Body -->
              <div id="passwordAccordionBody" style="${isPasswordChangeExpanded ? 'display:block' : 'display:none'}; margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-glass);">
                <form id="mobChangePasswordForm">
                  <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input type="password" class="form-input" id="inputCurrentPass" placeholder="Enter current password" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-input" id="inputNewPass" placeholder="Enter new password" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" class="form-input" id="inputConfirmPass" placeholder="Confirm new password" required />
                  </div>

                  <button type="submit" class="btn-gold" style="width:100%; justify-content:center; padding:0.75rem;">
                    💾 Save New Password
                  </button>
                </form>
              </div>
            </div>

            <!-- 3. Customer Support (WhatsApp 01794146475) -->
            <div class="glass-card" style="text-align:center; margin-bottom:1.25rem;">
              <div style="font-size:2rem; margin-bottom:0.4rem;">💬</div>
              <h4 style="margin-bottom:0.3rem;">24/7 Customer Support</h4>
              <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">
                Need help with deposit, card issues or reloads? Contact our official WhatsApp team directly.
              </p>

              <a href="https://wa.me/8801794146475" target="_blank" class="btn-primary" style="width:100%; justify-content:center; padding:0.85rem; background:linear-gradient(135deg, #25D366 0%, #128C7E 100%); color:#fff; font-weight:700; text-decoration:none; display:flex; align-items:center; gap:8px; border-radius:10px;">
                📱 WhatsApp Support: 01794146475
              </a>
            </div>

            <!-- 4. LOG OUT BUTTON (BELOW WHATSAPP SUPPORT) -->
            <div style="margin-bottom:1.5rem;">
              <button type="button" id="mobBtnLogoutProfile" onclick="window.handleUserLogout()" class="btn-danger" style="width:100%; justify-content:center; padding:0.95rem; font-weight:800; font-size:1rem; border-radius:12px; display:flex; align-items:center; gap:8px; cursor:pointer; background:#ef4444; color:#fff; border:none; box-shadow: 0 4px 16px rgba(239,68,68,0.35);">
                <span style="font-size:1.2rem;">🚪</span> <span>Log Out</span>
              </button>
            </div>

            <!-- App Info Footer -->
            <div style="text-align:center; font-size:0.75rem; color:var(--text-dim); padding:0.5rem 0;">
              <div>GoodPay Visa Card & Bangladeshi MFS</div>
              <div>Secure Digital Financial Services</div>
            </div>
          </div>

        </div>

        <nav class="mobile-bottom-nav">
          <div class="mobile-nav-item ${mobileTab === 'home' ? 'active' : ''}" id="mobNavHome">
            <span class="nav-icon">💳</span> Home
          </div>
          <div class="mobile-nav-item ${mobileTab === 'recharge' ? 'active' : ''}" id="mobNavRecharge">
            <span class="nav-icon">⚡</span> Recharge
          </div>
          <div class="mobile-nav-item ${mobileTab === 'transaction' ? 'active' : ''}" id="mobNavTransaction">
            <span class="nav-icon">📜</span> Transaction
          </div>
          <div class="mobile-nav-item ${mobileTab === 'profile' ? 'active' : ''}" id="mobNavProfile">
            <span class="nav-icon">👤</span> Profile
          </div>
        </nav>

      </div>
    </div>
  `;
}

function attachRemodeledMobileEvents() {
  const user = store.getCurrentUser();
  const userCards = store.getCards(user.id);

  document.getElementById('btnToggleFrameOn')?.addEventListener('click', () => {
    isDeviceFrameMode = true;
    renderMainContent();
  });
  document.getElementById('btnToggleFrameOff')?.addEventListener('click', () => {
    isDeviceFrameMode = false;
    renderMainContent();
  });

  const switchMobileTab = (tab) => {
    mobileTab = tab;
    renderMainContent();
  };

  document.getElementById('mobNavHome')?.addEventListener('click', () => switchMobileTab('home'));
  document.getElementById('mobNavRecharge')?.addEventListener('click', () => switchMobileTab('recharge'));
  document.getElementById('mobNavTransaction')?.addEventListener('click', () => switchMobileTab('transaction'));
  document.getElementById('mobNavProfile')?.addEventListener('click', () => switchMobileTab('profile'));

  // Request Card Handler (1 Card Max Limit check)
  const handleOrderCard = async () => {
    if (userCards.length >= 1) {
      await showAlert(
        'Each account is allowed 1 Visa Card maximum (1 Person = 1 Card).',
        { title: '1 Card Limit Reached', type: 'warning', icon: '💳' }
      );
      return;
    }

    const customName = await showPrompt(
      'Enter the name to display on your card.',
      { title: '💳 New Virtual Visa Card', placeholder: user.name, defaultValue: user.name, icon: '💳' }
    );
    if (customName === null) return; // cancelled

    const res = store.createCard(user.id, 'VIRTUAL', customName);
    if (res.success) {
      showToast(`Your VIRTUAL Visa card has been issued instantly!`);
      renderApp();
    } else {
      await showAlert(res.message, { title: 'Card Error', type: 'danger' });
    }
  };

  document.getElementById('mobBtnOrderNewCardHome')?.addEventListener('click', handleOrderCard);
  document.getElementById('mobBtnOrderFirstCardHome')?.addEventListener('click', handleOrderCard);

  // Toggle Email Accordion
  const toggleEmailBtn = document.getElementById('btnToggleEmailAccordion');
  if (toggleEmailBtn) {
    toggleEmailBtn.addEventListener('click', () => {
      isEmailChangeExpanded = !isEmailChangeExpanded;
      const body = document.getElementById('emailAccordionBody');
      const arrow = document.getElementById('emailAccordionArrow');
      if (body && arrow) {
        if (isEmailChangeExpanded) {
          body.style.display = 'block';
          arrow.textContent = '▲ Collapse';
        } else {
          body.style.display = 'none';
          arrow.textContent = '▼ Expand';
        }
      }
    });
  }

  // Change Email Form Submit
  const emailForm = document.getElementById('mobChangeEmailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('inputNewEmail').value.trim();
      const pass = document.getElementById('inputEmailConfirmPass').value;

      if (!newEmail || !newEmail.includes('@')) {
        await showAlert('Please enter a valid email address.', { title: 'Invalid Email', type: 'warning', icon: '📧' });
        return;
      }

      store.updateUser(user.id, { email: newEmail });
      showToast(`Email successfully updated to ${newEmail}!`);
      emailForm.reset();
      isEmailChangeExpanded = false;
      renderApp();
    });
  }

  // Toggle Password Accordion
  const togglePassBtn = document.getElementById('btnTogglePasswordAccordion');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      isPasswordChangeExpanded = !isPasswordChangeExpanded;
      const body = document.getElementById('passwordAccordionBody');
      const arrow = document.getElementById('passwordAccordionArrow');
      if (body && arrow) {
        if (isPasswordChangeExpanded) {
          body.style.display = 'block';
          arrow.textContent = '▲ Collapse';
        } else {
          body.style.display = 'none';
          arrow.textContent = '▼ Expand';
        }
      }
    });
  }

  // Change Password Form Submit
  const passForm = document.getElementById('mobChangePasswordForm');
  if (passForm) {
    passForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPass = document.getElementById('inputNewPass').value;
      const confirmPass = document.getElementById('inputConfirmPass').value;

      if (newPass !== confirmPass) {
        await showAlert('New password and confirm password do not match.', { title: 'Password Mismatch', type: 'danger', icon: '🔒' });
        return;
      }

      showToast('Password updated successfully!');
      passForm.reset();
      isPasswordChangeExpanded = false;
      renderApp();
    });
  }

  // Global and local Logout handler for Header & Profile Tab
  window.handleUserLogout = async () => {
    const confirmed = await showDangerConfirm(
      'You will be signed out of your GoodPay account. Any pending sessions will end.',
      { title: 'Log Out?', confirmLabel: '🚪 Log Out', icon: '🚪' }
    );
    if (confirmed) {
      store.logout();
      showToast('Logged out of GoodPay account');
      mobileTab = 'home';
      renderApp();
    }
  };

  document.getElementById('mobBtnLogoutProfile')?.addEventListener('click', window.handleUserLogout);

  userCards.forEach(c => {
    attachVisaCardEvents(
      c, store, showToast,
      () => renderApp(),
      () => switchMobileTab('recharge'),
      (activationFeeUSD) => {
        // Navigate to recharge tab in Activation Mode
        window._cardActivationMode = true;
        window._cardActivationFeeUSD = activationFeeUSD;
        window._cardActivationUserId = user.id;
        switchMobileTab('recharge');
      }
    );
  });

  if (mobileTab === 'recharge') {
    attachMfsDepositEvents(store, user, showToast, () => renderApp());
  }
}

export function renderApp() {
  renderNavbar();
  renderMainContent();
}

// Silently refresh card/balance from server and re-render if status changed
async function syncAndRefresh() {
  if (!store.isLoggedIn()) return;
  const cardsBefore = JSON.stringify(store.getCards());
  await store.refreshFromServer();
  const cardsAfter = JSON.stringify(store.getCards());
  if (cardsBefore !== cardsAfter) {
    renderApp();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  store.subscribe(() => renderNavbar());
  renderApp();

  // Immediately sync card status from server on load
  syncAndRefresh();

  // Poll every 10 seconds to catch admin approvals in real time
  setInterval(() => {
    syncAndRefresh();
  }, 10000);

  // Also sync when user returns to the tab (visibility change)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncAndRefresh();
  });
});
