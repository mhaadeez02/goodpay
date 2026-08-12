/**
 * GoodPay - PC Workstation Admin Control Panel Component
 * High-density desktop workspace for full user database management, balance reloads, and deposit approvals.
 */

export function renderAdminPanel(store) {
  const users = store.getUsers();
  const deposits = store.getDeposits();
  const cards = store.getCards();
  const settings = store.getSettings();

  const pendingDeposits = deposits.filter(d => d.status === 'PENDING');
  const totalWalletUSD = users.reduce((acc, u) => acc + (u.balanceUSD || 0), 0);
  const totalPendingUSD = pendingDeposits.reduce((acc, d) => acc + (d.amountUSD || 0), 0);

  return `
    <div class="pc-admin-workstation">
      
      <!-- DESKTOP PC ADMIN SIDEBAR -->
      <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
          <div style="font-family:var(--font-heading); font-size:1.25rem; font-weight:800; color:var(--accent-gold); display:flex; align-items:center; gap:0.5rem;">
            🛡️ GoodPay Admin
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">PC Workstation v1.0</div>
        </div>

        <div class="admin-sidebar-link active" id="pcSidebarUsers">
          <span class="icon">👥</span> User DB Directory
          <span class="badge approved" style="margin-left:auto; font-size:0.65rem;">${users.length}</span>
        </div>

        <div class="admin-sidebar-link" id="pcSidebarDeposits">
          <span class="icon">📥</span> Pending Deposits
          ${pendingDeposits.length > 0 ? `<span class="badge pending" style="margin-left:auto; font-size:0.65rem;">${pendingDeposits.length}</span>` : ''}
        </div>

        <div class="admin-sidebar-link" id="pcSidebarCards">
          <span class="icon">💳</span> Visa Cards System
          <span class="badge" style="margin-left:auto; font-size:0.65rem; background:rgba(255,255,255,0.1);">${cards.length}</span>
        </div>

        <div class="admin-sidebar-link" id="pcSidebarSettings">
          <span class="icon">⚙️</span> MFS & Rate Settings
        </div>

        <div style="margin-top:auto; padding-top:1.5rem; border-top:1px solid var(--border-glass);">
          <div style="font-size:0.75rem; color:var(--text-muted);">MFS Admin Numbers</div>
          <div style="font-size:0.8rem; color:var(--accent-pink); font-weight:600; margin-top:0.3rem;">bKash: ${settings.mfsNumbers.bkash.number}</div>
          <div style="font-size:0.8rem; color:var(--accent-orange); font-weight:600;">Nagad: ${settings.mfsNumbers.nagad.number}</div>
          <div style="font-size:0.8rem; color:var(--accent-purple); font-weight:600;">Rocket: ${settings.mfsNumbers.rocket.number}</div>
        </div>
      </aside>

      <!-- DESKTOP PC MAIN WORKSPACE TERMINAL -->
      <main class="admin-main-terminal">
        
        <!-- PC METRICS HEADER GRID -->
        <div class="stats-grid">
          <div class="stat-box highlight-gold">
            <div class="stat-label">Total Users DB</div>
            <div class="stat-value" style="color:var(--accent-gold)">${users.length}</div>
            <div class="stat-subtext">Registered User Accounts</div>
          </div>

          <div class="stat-box highlight-cyan">
            <div class="stat-label">System Wallet Balances</div>
            <div class="stat-value" style="color:var(--accent-cyan)">$${totalWalletUSD.toFixed(2)}</div>
            <div class="stat-subtext">≈ ৳${(totalWalletUSD * settings.exchangeRateBDT).toLocaleString()} BDT</div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Pending Deposits Queue</div>
            <div class="stat-value" style="color:${pendingDeposits.length > 0 ? '#FBBF24' : 'var(--text-muted)'}">
              ${pendingDeposits.length}
            </div>
            <div class="stat-subtext">$${totalPendingUSD.toFixed(2)} USD awaiting verification</div>
          </div>

          <div class="stat-box">
            <div class="stat-label">Active Visa Cards</div>
            <div class="stat-value" style="color:#FFF">${cards.length}</div>
            <div class="stat-subtext">${cards.filter(c => c.type === 'VIRTUAL').length} Virtual / ${cards.filter(c => c.type === 'PHYSICAL').length} Physical</div>
          </div>
        </div>

        <!-- TAB 1: USER DATABASE DIRECTORY & INDIVIDUAL CONTROLLER -->
        <div class="pc-admin-tab" id="pcTabContentUsers">
          <div class="glass-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
              <div>
                <h2>User Database Directory</h2>
                <p style="color:var(--text-muted); font-size:0.85rem;">Manage individual user accounts, reload balances, adjust status & KYC</p>
              </div>
              <input type="text" class="form-input" id="pcSearchUsers" placeholder="🔍 Search user by Name, Email, Phone..." style="max-width:340px;" />
            </div>

            <div class="data-table-container">
              <table class="data-table" id="pcUsersTable">
                <thead>
                  <tr>
                    <th>User ID & Name</th>
                    <th>Email & Phone</th>
                    <th>USD Balance</th>
                    <th>BDT Equivalent</th>
                    <th>KYC Status</th>
                    <th>Cards</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => {
                    const userCards = cards.filter(c => c.userId === u.id);
                    return `
                      <tr>
                        <td>
                          <div style="display:flex; align-items:center; gap:0.6rem;">
                            <div class="user-avatar" style="width:34px; height:34px;">${u.name.charAt(0)}</div>
                            <div>
                              <div style="font-weight:700; color:#fff;">${u.name}</div>
                              <div style="font-size:0.75rem; color:var(--text-dim);">${u.id} | Joined: ${u.joinedDate}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-size:0.85rem; color:#fff;">${u.email}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted);">${u.phone}</div>
                        </td>
                        <td style="font-family:var(--font-heading); font-weight:800; color:var(--accent-green); font-size:1.15rem;">
                          $${u.balanceUSD.toFixed(2)}
                        </td>
                        <td style="font-size:0.85rem; color:var(--text-muted);">
                          ৳${(u.balanceUSD * settings.exchangeRateBDT).toLocaleString()}
                        </td>
                        <td>
                          <span class="badge ${u.kycStatus.toLowerCase()}">${u.kycStatus}</span>
                        </td>
                        <td>
                          <span class="badge approved">${userCards.length}/1 Card</span>
                        </td>
                        <td>
                          <button class="btn-gold btn-manage-user" data-user-id="${u.id}" style="padding:0.45rem 0.9rem; font-size:0.8rem;">
                            ⚙️ Control Account
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: PENDING DEPOSITS QUEUE -->
        <div class="pc-admin-tab" id="pcTabContentDeposits" style="display:none;">
          <div class="glass-card">
            <h2 style="margin-bottom:0.5rem;">MFS Deposit Approval Terminal</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Review incoming bKash, Nagad, Rocket deposit claims and auto-credit user wallets</p>
            
            ${deposits.length === 0 ? `
              <div style="text-align:center; padding:3rem; color:var(--text-muted);">No deposits found in system database.</div>
            ` : `
              <div class="data-table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>User Account</th>
                      <th>Gateway</th>
                      <th>Sender Info & TrxID</th>
                      <th>Amount BDT</th>
                      <th>Net USD Credit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${deposits.map(d => `
                      <tr>
                        <td>
                          <div style="font-weight:700; color:#fff;">${d.userName}</div>
                          <div style="font-size:0.75rem; color:var(--text-dim);">${d.createdAt}</div>
                        </td>
                        <td>
                          <span class="badge" style="background:rgba(255,255,255,0.06); color:#fff; text-transform:uppercase;">
                            ${d.gateway}
                          </span>
                        </td>
                        <td>
                          <div style="font-family:monospace; font-weight:700; color:var(--accent-cyan); font-size:1rem;">${d.trxId}</div>
                          <div style="font-size:0.8rem; color:var(--text-muted);">Sender Mobile: ${d.senderNumber}</div>
                        </td>
                        <td style="font-weight:700;">৳${d.amountBDT.toLocaleString()}</td>
                        <td style="font-family:var(--font-heading); font-weight:800; color:var(--accent-green); font-size:1.1rem;">$${d.amountUSD.toFixed(2)}</td>
                        <td>
                          <span class="badge ${d.status.toLowerCase()}">${d.status}</span>
                        </td>
                        <td>
                          ${d.status === 'PENDING' ? `
                            <div style="display:flex; gap:0.5rem;">
                              <button class="btn-primary btn-approve-deposit" data-dep-id="${d.id}" style="padding:0.45rem 0.85rem; font-size:0.8rem;">
                                ✅ Approve
                              </button>
                              <button class="btn-danger btn-reject-deposit" data-dep-id="${d.id}" style="padding:0.45rem 0.85rem; font-size:0.8rem;">
                                ❌ Reject
                              </button>
                            </div>
                          ` : `
                            <span style="font-size:0.8rem; color:var(--text-dim);">${d.approvedAt || d.rejectedAt || 'Processed'}</span>
                          `}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- TAB 3: ALL ISSUED VISA CARDS -->
        <div class="pc-admin-tab" id="pcTabContentCards" style="display:none;">
          <div class="glass-card">
            <h2 style="margin-bottom:0.5rem;">Visa Cards System Registry</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">View and manage all generated Virtual and Physical Visa Cards</p>
            
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cardholder / User</th>
                    <th>Card Number</th>
                    <th>Type</th>
                    <th>Expiry & CVV</th>
                    <th>Card Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${cards.map(c => {
                    const owner = users.find(u => u.id === c.userId);
                    return `
                      <tr>
                        <td>
                          <div style="font-weight:700; color:#fff;">${c.cardholderName}</div>
                          <div style="font-size:0.75rem; color:var(--text-dim);">${owner ? owner.email : c.userId}</div>
                        </td>
                        <td style="font-family:monospace; font-weight:700; color:var(--accent-cyan);">${c.cardNumber}</td>
                        <td><span class="badge approved">${c.type}</span></td>
                        <td>${c.expiryDate} (CVV: ${c.cvv})</td>
                        <td style="font-weight:700; color:var(--accent-green);">$${c.balanceUSD.toFixed(2)}</td>
                        <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
                        <td>
                          <button class="btn-secondary btn-toggle-card-status" data-card-id="${c.id}" style="padding:0.35rem 0.75rem; font-size:0.75rem;">
                            ${c.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 4: MFS & SYSTEM SETTINGS -->
        <div class="pc-admin-tab" id="pcTabContentSettings" style="display:none;">
          <div class="glass-card" style="max-width:720px;">
            <h2 style="margin-bottom:0.5rem;">System Configuration Console</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Manage Bangladeshi MFS wallet numbers, exchange rates, and card fees</p>
            
            <form id="pcAdminSettingsForm">
              <h4 style="color:var(--accent-gold); margin-bottom:0.75rem;">Bangladeshi MFS Admin Wallet Numbers</h4>
              
              <div class="form-group">
                <label class="form-label">bKash Admin Phone Number</label>
                <input type="text" class="form-input" id="pcSettingBkash" value="${settings.mfsNumbers.bkash.number}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Nagad Admin Phone Number</label>
                <input type="text" class="form-input" id="pcSettingNagad" value="${settings.mfsNumbers.nagad.number}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Rocket Admin Phone Number</label>
                <input type="text" class="form-input" id="pcSettingRocket" value="${settings.mfsNumbers.rocket.number}" required />
              </div>

              <h4 style="color:var(--accent-cyan); margin:1.5rem 0 0.75rem 0;">Exchange Rate & System Fees</h4>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">Exchange Rate (1 USD = ? BDT)</label>
                  <input type="number" step="0.1" class="form-input" id="pcSettingExchangeRate" value="${settings.exchangeRateBDT}" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Deposit Fee (%)</label>
                  <input type="number" step="0.1" class="form-input" id="pcSettingDepositFee" value="${settings.depositFeePercent}" required />
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">Virtual Card Fee ($ USD)</label>
                  <input type="number" step="0.5" class="form-input" id="pcSettingVirtFee" value="${settings.virtualCardFeeUSD}" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Physical Card Fee ($ USD)</label>
                  <input type="number" step="0.5" class="form-input" id="pcSettingPhysFee" value="${settings.physicalCardFeeUSD}" required />
                </div>
              </div>

              <button type="submit" class="btn-gold" style="width:100%; justify-content:center; padding:0.9rem; margin-top:1rem;">
                💾 Save System Settings
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>

    <!-- USER CONTROL DRAWER / MODAL -->
    <div class="modal-overlay" id="userControlModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modalUserName">Control User Account</h3>
          <button class="modal-close" id="btnCloseUserModal">&times;</button>
        </div>
        <div id="modalUserContent">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;
}

export function attachAdminPanelEvents(store, showToast, refreshCallback) {
  const navItems = [
    { btn: 'pcSidebarUsers', content: 'pcTabContentUsers' },
    { btn: 'pcSidebarDeposits', content: 'pcTabContentDeposits' },
    { btn: 'pcSidebarCards', content: 'pcTabContentCards' },
    { btn: 'pcSidebarSettings', content: 'pcTabContentSettings' }
  ];

  navItems.forEach(item => {
    const btn = document.getElementById(item.btn);
    if (btn) {
      btn.addEventListener('click', () => {
        navItems.forEach(n => {
          document.getElementById(n.btn)?.classList.remove('active');
          const content = document.getElementById(n.content);
          if (content) content.style.display = 'none';
        });
        btn.classList.add('active');
        const activeContent = document.getElementById(item.content);
        if (activeContent) activeContent.style.display = 'block';
      });
    }
  });

  const searchInput = document.getElementById('pcSearchUsers');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const rows = document.querySelectorAll('#pcUsersTable tbody tr');
      rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('.btn-approve-deposit').forEach(btn => {
    btn.addEventListener('click', () => {
      const depId = btn.dataset.depId;
      const res = store.approveDeposit(depId);
      if (res.success) {
        showToast('Deposit approved! User wallet credited automatically.');
        if (refreshCallback) refreshCallback();
      } else {
        alert(res.message);
      }
    });
  });

  document.querySelectorAll('.btn-reject-deposit').forEach(btn => {
    btn.addEventListener('click', () => {
      const depId = btn.dataset.depId;
      const reason = prompt('Enter rejection reason for user:', 'Invalid TrxID or mismatched amount');
      if (reason !== null) {
        const res = store.rejectDeposit(depId, reason);
        if (res.success) {
          showToast('Deposit rejected.');
          if (refreshCallback) refreshCallback();
        } else {
          alert(res.message);
        }
      }
    });
  });

  document.querySelectorAll('.btn-toggle-card-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.dataset.cardId;
      const card = store.getCard(cardId);
      if (card) {
        const nextStatus = card.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
        store.updateCard(cardId, { status: nextStatus });
        showToast(`Card status set to ${nextStatus}`);
        if (refreshCallback) refreshCallback();
      }
    });
  });

  const modal = document.getElementById('userControlModal');
  const modalClose = document.getElementById('btnCloseUserModal');
  if (modalClose && modal) {
    modalClose.addEventListener('click', () => modal.classList.remove('active'));
  }

  document.querySelectorAll('.btn-manage-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.userId;
      const user = store.getUser(userId);
      if (!user) return;

      const modalName = document.getElementById('modalUserName');
      const modalContent = document.getElementById('modalUserContent');

      if (modalName) modalName.textContent = `Control Account: ${user.name}`;
      if (modalContent) {
        modalContent.innerHTML = `
          <div style="margin-bottom:1rem; font-size:0.9rem;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Joined:</strong> ${user.joinedDate}</p>
            <p><strong>Current Wallet Balance:</strong> <span style="color:var(--accent-green); font-weight:700;">$${user.balanceUSD.toFixed(2)}</span></p>
          </div>

          <div class="glass-card" style="background:var(--bg-surface); margin-bottom:1.25rem;">
            <h4 style="color:var(--accent-gold); margin-bottom:0.6rem;">⚡ Manual Balance Reload / Adjustment</h4>
            <div class="form-group">
              <label class="form-label">Reload Amount ($ USD) [Use negative to deduct]</label>
              <input type="number" step="0.01" class="form-input" id="modalReloadAmount" placeholder="e.g. 100.00 or -25.00" />
            </div>
            <div class="form-group">
              <label class="form-label">Admin Reason Note</label>
              <input type="text" class="form-input" id="modalReloadNote" placeholder="e.g. Approved bKash offline deposit" />
            </div>
            <button class="btn-gold" id="btnExecuteReload" style="width:100%; justify-content:center;">
              💰 Execute Balance Adjustment
            </button>
          </div>

          <div style="display:flex; gap:0.5rem;">
            <button class="btn-secondary" id="btnToggleKyc" style="flex:1;">
              ${user.kycStatus === 'VERIFIED' ? 'Mark KYC Unverified' : '✅ Verify KYC'}
            </button>

            <button class="${user.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}" id="btnToggleUserStatus" style="flex:1;">
              ${user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
            </button>
          </div>
        `;

        modal.classList.add('active');

        document.getElementById('btnExecuteReload')?.addEventListener('click', () => {
          const amount = document.getElementById('modalReloadAmount').value;
          const note = document.getElementById('modalReloadNote').value;
          if (!amount || isNaN(amount)) {
            alert('Please enter a valid amount');
            return;
          }
          const res = store.reloadUserBalance(user.id, amount, note);
          if (res.success) {
            showToast(`Balance updated! New Balance: $${res.newBalance.toFixed(2)}`);
            modal.classList.remove('active');
            if (refreshCallback) refreshCallback();
          }
        });

        document.getElementById('btnToggleKyc')?.addEventListener('click', () => {
          const nextKyc = user.kycStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
          store.updateUser(user.id, { kycStatus: nextKyc });
          showToast(`KYC status set to ${nextKyc}`);
          modal.classList.remove('active');
          if (refreshCallback) refreshCallback();
        });

        document.getElementById('btnToggleUserStatus')?.addEventListener('click', () => {
          const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          store.updateUser(user.id, { status: nextStatus });
          showToast(`User account status set to ${nextStatus}`);
          modal.classList.remove('active');
          if (refreshCallback) refreshCallback();
        });
      }
    });
  });

  document.getElementById('pcAdminSettingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      exchangeRateBDT: parseFloat(document.getElementById('pcSettingExchangeRate').value),
      depositFeePercent: parseFloat(document.getElementById('pcSettingDepositFee').value),
      virtualCardFeeUSD: parseFloat(document.getElementById('pcSettingVirtFee').value),
      physicalCardFeeUSD: parseFloat(document.getElementById('pcSettingPhysFee').value),
      mfsNumbers: {
        bkash: { ...store.getSettings().mfsNumbers.bkash, number: document.getElementById('pcSettingBkash').value },
        nagad: { ...store.getSettings().mfsNumbers.nagad, number: document.getElementById('pcSettingNagad').value },
        rocket: { ...store.getSettings().mfsNumbers.rocket, number: document.getElementById('pcSettingRocket').value }
      }
    };
    store.updateSettings(updated);
    showToast('Admin system settings saved successfully!');
    if (refreshCallback) refreshCallback();
  });
}
