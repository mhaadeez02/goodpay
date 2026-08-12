/* GoodPay v2.0.0.1 - User Frontend Logic */

const API_BASE = window.location.port === '8000' || window.location.hostname === 'localhost'
  ? '/api' 
  : 'api.php?action=';

const buildUrl = (endpoint, actionName, params = {}) => {
  let url = API_BASE.includes('api.php')
    ? `api.php?action=${actionName}`
    : `${API_BASE}/${endpoint}`;

  const keys = Object.keys(params);
  if (keys.length > 0) {
    const separator = url.includes('?') ? '&' : '?';
    const qs = keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    url += `${separator}${qs}`;
  }
  return url;
};

// Global App State
let currentUser = JSON.parse(localStorage.getItem('goodpay_user')) || null;
let currentCard = JSON.parse(localStorage.getItem('goodpay_card')) || null;
let mfsSettings = {
  bkash_number: '01794146475',
  nagad_number: '01794146475',
  rocket_number: '01794146475',
  card_price_bdt: 1350,
  usd_to_bdt_rate: 135,
  cashout_charge_pct: 2
};

let isCvvVisible = false;
let selectedBuyMethod = 'bKash';
let selectedRechargeMethod = 'bKash';

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const authScreen = document.getElementById('authScreen');
const appMain = document.getElementById('appMain');
const bottomNav = document.getElementById('bottomNav');
const toastContainer = document.getElementById('toastContainer');

// Init Theme
const initTheme = () => {
  const savedTheme = localStorage.getItem('goodpay_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
};

const updateThemeIcon = (theme) => {
  themeToggleBtn.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>'
    : '<i class="fa-solid fa-moon"></i>';
};

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('goodpay_theme', nextTheme);
  updateThemeIcon(nextTheme);
});

// Toast Notification
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
};

// Fetch MFS Settings
const fetchMfsSettings = async () => {
  try {
    const res = await fetch(buildUrl('mfs-settings', 'mfs_settings'));
    const json = await res.json();
    if (json.success && json.data) {
      mfsSettings = json.data;
      updateMfsUi();
    }
  } catch (err) {
    console.error("MFS fetch error:", err);
  }
};

const updateMfsUi = () => {
  // Update Recharge Rate UI
  const rateDisplay = document.getElementById('rateDisplay');
  if (rateDisplay) rateDisplay.innerText = `${mfsSettings.usd_to_bdt_rate.toFixed(2)} BDT`;

  // Update Buy Card Price
  const priceFormatted = `${Math.round(mfsSettings.card_price_bdt)} টাকা`;
  const modalPrice = document.getElementById('modalCardPriceDisplay');
  if (modalPrice) modalPrice.innerText = priceFormatted;

  const homePriceText = document.getElementById('homeCardPriceText');
  if (homePriceText) homePriceText.innerText = priceFormatted;

  const homePriceBadge = document.getElementById('homeCardPriceBadge');
  if (homePriceBadge) homePriceBadge.innerText = priceFormatted;

  // Update Copy Numbers
  updateMfsNumbers();
};

const updateMfsNumbers = () => {
  const buyNum = document.getElementById('buyMfsNumber');
  if (buyNum) {
    if (selectedBuyMethod === 'bKash') buyNum.innerText = mfsSettings.bkash_number;
    else if (selectedBuyMethod === 'Nagad') buyNum.innerText = mfsSettings.nagad_number;
    else if (selectedBuyMethod === 'Rocket') buyNum.innerText = mfsSettings.rocket_number;
  }

  const rechNum = document.getElementById('rechargeMfsNumber');
  if (rechNum) {
    if (selectedRechargeMethod === 'bKash') rechNum.innerText = mfsSettings.bkash_number;
    else if (selectedRechargeMethod === 'Nagad') rechNum.innerText = mfsSettings.nagad_number;
    else if (selectedRechargeMethod === 'Rocket') rechNum.innerText = mfsSettings.rocket_number;
  }
};

// Auth Tab Switchers
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.className = 'btn-primary';
  tabRegisterBtn.className = 'btn-secondary';
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
});

tabRegisterBtn.addEventListener('click', () => {
  tabRegisterBtn.className = 'btn-primary';
  tabLoginBtn.className = 'btn-secondary';
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch(buildUrl('auth/login', 'login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      currentCard = data.card;
      localStorage.setItem('goodpay_user', JSON.stringify(currentUser));
      localStorage.setItem('goodpay_card', JSON.stringify(currentCard));
      showToast(data.message, 'success');
      renderAppView();
    } else {
      showToast(data.message || 'লগইন ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Register Handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (password.length < 6) {
    showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'warning');
    return;
  }

  try {
    const res = await fetch(buildUrl('auth/register', 'register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      currentCard = data.card;
      localStorage.setItem('goodpay_user', JSON.stringify(currentUser));
      localStorage.setItem('goodpay_card', JSON.stringify(currentCard));
      showToast(data.message, 'success');
      renderAppView();
    } else {
      showToast(data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Refresh User Profile & Card from Server
const refreshUserData = async () => {
  if (!currentUser) return;
  try {
    const res = await fetch(buildUrl('user/profile', 'user_profile', { user_id: currentUser.id }));
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      currentCard = data.card;
      localStorage.setItem('goodpay_user', JSON.stringify(currentUser));
      localStorage.setItem('goodpay_card', JSON.stringify(currentCard));
    }
  } catch (err) {
    console.error("Refresh error:", err);
  }
};

// Bottom Navigation Switching
const navTabs = document.querySelectorAll('.nav-tab');
const tabViews = document.querySelectorAll('.tab-view');

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');
    navTabs.forEach(t => t.classList.remove('active'));
    tabViews.forEach(v => v.style.display = 'none');
    
    tab.classList.add('active');
    document.getElementById(targetTab).style.display = 'block';

    if (targetTab === 'tabRechargeView') {
      fetchUserHistory();
    }
  });
});

// Render Main App Views based on Login & Card Status
const renderAppView = async () => {
  if (!currentUser) {
    authScreen.style.display = 'block';
    appMain.style.display = 'none';
    bottomNav.style.display = 'none';
    return;
  }

  authScreen.style.display = 'none';
  appMain.style.display = 'block';
  bottomNav.style.display = 'flex';

  await refreshUserData();
  fetchUserHistory();
  renderCardDisplay();
  renderSettingsScreen();
};

// Render Card Display
const renderCardDisplay = () => {
  if (!currentCard) return;

  const badge = document.getElementById('cardStatusBadge');
  const balance = document.getElementById('cardBalanceAmount');
  const numDisplay = document.getElementById('cardNumberDisplay');
  const expiryDisplay = document.getElementById('cardExpiryDisplay');
  const cvvDisplay = document.getElementById('cardCvvDisplay');
  const prePurchaseSection = document.getElementById('prePurchaseSection');
  const processingSection = document.getElementById('processingSection');
  const activeDashboardSection = document.getElementById('activeDashboardSection');

  // Set Balance
  balance.innerText = `${parseFloat(currentCard.balance).toFixed(2)} $`;
  expiryDisplay.innerText = currentCard.expiry_date || '08/31';

  // Set Card Status Badging
  const status = currentCard.status || 'unpurchased';
  badge.className = `card-status-badge ${status}`;
  badge.innerText = status.toUpperCase();

  // Render Card Number & CVV based on Status & Toggle
  const fullNum = currentCard.card_number || '4532 8912 3456 1234';
  const lastFour = fullNum.slice(-4);

  if (status === 'unpurchased') {
    numDisplay.innerText = `**** **** **** ${lastFour}`;
    cvvDisplay.innerText = isCvvVisible ? (currentCard.cvv || '892') : '***';
    prePurchaseSection.style.display = 'block';
    processingSection.style.display = 'none';
    activeDashboardSection.style.display = 'none';
  } else if (status === 'processing') {
    numDisplay.innerText = fullNum;
    cvvDisplay.innerText = isCvvVisible ? (currentCard.cvv || '892') : '***';
    prePurchaseSection.style.display = 'none';
    processingSection.style.display = 'block';
    activeDashboardSection.style.display = 'none';
  } else if (status === 'active') {
    numDisplay.innerText = isCvvVisible ? fullNum : `**** **** **** ${lastFour}`;
    cvvDisplay.innerText = isCvvVisible ? (currentCard.cvv || '892') : '***';
    prePurchaseSection.style.display = 'none';
    processingSection.style.display = 'none';
    activeDashboardSection.style.display = 'block';
  }
};

// CVV Toggle Button
document.getElementById('toggleCvvBtn').addEventListener('click', () => {
  isCvvVisible = !isCvvVisible;
  const icon = document.getElementById('toggleCvvBtn').querySelector('i');
  icon.className = isCvvVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  renderCardDisplay();
});

// Card Purchase Flow Modals
const buyCardModal = document.getElementById('buyCardModal');
const buyStep1 = document.getElementById('buyStep1');
const buyStep2 = document.getElementById('buyStep2');
const buyStep3 = document.getElementById('buyStep3');

document.getElementById('buyCardStartBtn').addEventListener('click', () => {
  if (!currentUser) return;
  document.getElementById('buyPhone').value = currentUser.phone || '';
  document.getElementById('buyFullName').value = currentUser.username || '';
  
  buyStep1.style.display = 'block';
  buyStep2.style.display = 'none';
  buyStep3.style.display = 'none';
  buyCardModal.classList.add('active');
  updateMfsNumbers();
});

// Close Modals
document.querySelectorAll('.closeModalBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  });
});

// Gateway selection in Buy Card
document.querySelectorAll('[data-buy-method]').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('[data-buy-method]').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedBuyMethod = opt.getAttribute('data-buy-method');
    updateMfsNumbers();
    document.getElementById('buyMethodInstructionText').innerText = `${selectedBuyMethod} এ`;
  });
});

document.getElementById('goToBuyStep2Btn').addEventListener('click', () => {
  const name = document.getElementById('buyFullName').value.trim();
  const phone = document.getElementById('buyPhone').value.trim();
  if (!name || !phone) {
    showToast('নাম ও ফোন নাম্বার প্রবেশ করান', 'warning');
    return;
  }
  buyStep1.style.display = 'none';
  buyStep2.style.display = 'block';
});

document.getElementById('goToBuyStep3Btn').addEventListener('click', () => {
  buyStep2.style.display = 'none';
  buyStep3.style.display = 'block';
});

document.getElementById('submitBuyCardFinalBtn').addEventListener('click', async () => {
  const senderNumber = document.getElementById('buySenderPhone').value.trim();
  if (!senderNumber) {
    showToast('সেন্ডার ফোন নাম্বার প্রবেশ করান', 'warning');
    return;
  }

  const fullName = document.getElementById('buyFullName').value.trim();
  const phone = document.getElementById('buyPhone').value.trim();

  try {
    const res = await fetch(buildUrl('user/buy-card', 'buy_card'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        full_name: fullName,
        phone_number: phone,
        payment_method: selectedBuyMethod,
        sender_number: senderNumber
      })
    });
    const data = await res.json();
    if (data.success) {
      buyCardModal.classList.remove('active');
      showToast(data.message, 'success');
      await refreshUserData();
      renderCardDisplay();
    } else {
      showToast(data.message || 'ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Copy Number helper
const setupCopyButton = (btnId, textElemId) => {
  document.getElementById(btnId).addEventListener('click', () => {
    const text = document.getElementById(textElemId).innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('নাম্বারটি কপি করা হয়েছে', 'success');
    });
  });
};

setupCopyButton('copyBuyMfsBtn', 'buyMfsNumber');
setupCopyButton('copyRechargeMfsBtn', 'rechargeMfsNumber');

// Recharge USD Calculation Logic
const rechargeUsdInput = document.getElementById('rechargeUsdInput');
const chargeDisplay = document.getElementById('chargeDisplay');
const totalBdtDisplay = document.getElementById('totalBdtDisplay');

rechargeUsdInput.addEventListener('input', () => {
  const usd = parseFloat(rechargeUsdInput.value) || 0;
  const rate = mfsSettings.usd_to_bdt_rate || 135;
  const chargePct = mfsSettings.cashout_charge_pct || 2;

  const baseBdt = usd * rate;
  const chargeBdt = baseBdt * (chargePct / 100.0);
  const totalBdt = baseBdt + chargeBdt;

  chargeDisplay.innerText = `${chargeBdt.toFixed(2)} BDT`;
  totalBdtDisplay.innerText = `${totalBdt.toFixed(2)} BDT`;
});

// Gateway Selection in Recharge Tab
document.querySelectorAll('[data-method]').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('[data-method]').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedRechargeMethod = opt.getAttribute('data-method');
    updateMfsNumbers();
    document.getElementById('rechargeGatewayInstruction').innerText = `${selectedRechargeMethod} এ`;
  });
});

// Submit Recharge Request
document.getElementById('submitRechargeBtn').addEventListener('click', async () => {
  const usd = parseFloat(rechargeUsdInput.value) || 0;
  const senderNumber = document.getElementById('rechargeSenderPhone').value.trim();

  if (usd <= 0) {
    showToast('সঠিক ডলারের পরিমাণ লিখুন', 'warning');
    return;
  }
  if (!senderNumber) {
    showToast('সেন্ডার ফোন নাম্বার লিখুন', 'warning');
    return;
  }

  try {
    const res = await fetch(buildUrl('user/recharge', 'recharge'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        usd_amount: usd,
        payment_method: selectedRechargeMethod,
        sender_number: senderNumber
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      rechargeUsdInput.value = '';
      document.getElementById('rechargeSenderPhone').value = '';
      totalBdtDisplay.innerText = '0.00 BDT';
      chargeDisplay.innerText = '0.00 BDT';
      fetchUserHistory();
    } else {
      showToast(data.message || 'আবেদন ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Transaction History State & Pagination (8 per page)
let userTransactions = [];
let historyCurrentPage = 1;
const historyItemsPerPage = 8;

// Fetch User Transaction History
const fetchUserHistory = async () => {
  if (!currentUser) return;
  try {
    const res = await fetch(buildUrl('user/history', 'user_history', { user_id: currentUser.id }));
    const data = await res.json();
    if (data.success) {
      userTransactions = data.transactions || [];
      renderHomeRecentHistory();
    }
  } catch (err) {
    console.error("History fetch error:", err);
  }
};

// Render Top 2 Recent Transactions on Home Screen
const renderHomeRecentHistory = () => {
  const listElem = document.getElementById('recentHistoryList');
  const showMoreBtn = document.getElementById('showMoreHistoryBtn');
  if (!listElem) return;

  if (!userTransactions.length) {
    listElem.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 0.88rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md);">কোনো ট্রানজেকশন হিস্ট্রি নেই</div>`;
    if (showMoreBtn) showMoreBtn.style.display = 'none';
    return;
  }

  // Render Top 2 Recent
  const top2 = userTransactions.slice(0, 2);
  listElem.innerHTML = top2.map(item => createHistoryItemHtml(item)).join('');

  // Show / Hide "Show More" Button
  if (showMoreBtn) {
    showMoreBtn.style.display = userTransactions.length > 2 ? 'flex' : 'none';
  }
};

// Helper to create transaction HTML item
const createHistoryItemHtml = (item) => {
  const isCard = item.type === 'card_purchase';
  const title = isCard ? 'কার্ড পারচেজ ফি' : `ডলার রিচার্জ ($${parseFloat(item.amount).toFixed(2)})`;
  const tagClass = item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending';
  const tagText = item.status === 'approved' ? 'অ্যাপ্রুভড' : item.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং';

  return `
    <div class="history-item">
      <div class="history-info">
        <div class="history-title">${title}</div>
        <div class="history-date">${item.created_at || ''} | ${item.payment_method} (${item.sender_number})</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">${parseFloat(item.total_bdt).toFixed(2)} ৳</div>
        <span class="status-tag ${tagClass}">${tagText}</span>
      </div>
    </div>
  `;
};

// Open Full History Modal
const showMoreHistoryBtn = document.getElementById('showMoreHistoryBtn');
const fullHistoryModal = document.getElementById('fullHistoryModal');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageCounterText = document.getElementById('pageCounterText');

if (showMoreHistoryBtn) {
  showMoreHistoryBtn.addEventListener('click', () => {
    historyCurrentPage = 1;
    renderPaginatedHistoryModal();
    fullHistoryModal.classList.add('active');
  });
}

// Render Paginated History Modal (8 per page)
const renderPaginatedHistoryModal = () => {
  const fullListElem = document.getElementById('fullHistoryList');
  if (!fullListElem) return;

  const totalItems = userTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / historyItemsPerPage));

  // Boundaries check
  if (historyCurrentPage < 1) historyCurrentPage = 1;
  if (historyCurrentPage > totalPages) historyCurrentPage = totalPages;

  const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
  const pageItems = userTransactions.slice(startIndex, startIndex + historyItemsPerPage);

  if (!pageItems.length) {
    fullListElem.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">কোনো ট্রানজেকশন নেই</div>`;
  } else {
    fullListElem.innerHTML = pageItems.map(item => createHistoryItemHtml(item)).join('');
  }

  // Update Pagination Controls UI
  if (pageCounterText) {
    pageCounterText.innerText = `পৃষ্ঠা ${historyCurrentPage} এর ${totalPages}`;
  }

  if (prevPageBtn) prevPageBtn.disabled = (historyCurrentPage <= 1);
  if (nextPageBtn) nextPageBtn.disabled = (historyCurrentPage >= totalPages);
};

// Pagination Button Click Listeners
if (prevPageBtn) {
  prevPageBtn.addEventListener('click', () => {
    if (historyCurrentPage > 1) {
      historyCurrentPage--;
      renderPaginatedHistoryModal();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(userTransactions.length / historyItemsPerPage);
    if (historyCurrentPage < totalPages) {
      historyCurrentPage++;
      renderPaginatedHistoryModal();
    }
  });
}

// Render Settings Screen
const renderSettingsScreen = () => {
  if (!currentUser) return;
  const username = currentUser.username || currentUser.phone;
  document.getElementById('settingsUsername').innerText = username;

  const phoneDisplay = document.getElementById('settingsUserPhoneDisplay');
  if (phoneDisplay) phoneDisplay.innerText = currentUser.phone || '';

  const avatarInitial = document.getElementById('profileAvatarInitial');
  if (avatarInitial) {
    const initialChar = (username.charAt(0) || 'U').toUpperCase();
    avatarInitial.innerText = initialChar;
  }

  const emailSubtext = document.getElementById('settingsEmailSubtext');
  if (emailSubtext) {
    emailSubtext.innerText = currentUser.email ? `বর্তমান ইমেইল: ${currentUser.email}` : 'ইমেইল যোগ বা পরিবর্তন করুন';
  }

  const verifiedBadge = document.getElementById('settingsVerifiedBadge');
  if (currentUser.is_verified == 1) {
    verifiedBadge.className = 'verified-badge verified';
    verifiedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Verified Account';
  } else {
    verifiedBadge.className = 'verified-badge unverified';
    verifiedBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Not Verified';
  }
};

// Password Change Modal Handlers
document.getElementById('openChangePassBtn').addEventListener('click', () => {
  document.getElementById('changePassModal').classList.add('active');
});

document.getElementById('changePassForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = document.getElementById('newPasswordInput').value.trim();
  if (newPass.length < 6) {
    showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'warning');
    return;
  }

  try {
    const res = await fetch(getApiUrl('user/update-profile', 'update_profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        field: 'password',
        value: newPass
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('changePassModal').classList.remove('active');
      showToast(data.message, 'success');
      document.getElementById('newPasswordInput').value = '';
    } else {
      showToast(data.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Email Change Modal Handlers
document.getElementById('openChangeEmailBtn').addEventListener('click', () => {
  document.getElementById('changeEmailModal').classList.add('active');
});

document.getElementById('changeEmailForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newEmail = document.getElementById('newEmailInput').value.trim();

  try {
    const res = await fetch(getApiUrl('user/update-profile', 'update_profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        field: 'email',
        value: newEmail
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('changeEmailModal').classList.remove('active');
      showToast(data.message, 'success');
      currentUser.email = newEmail;
      localStorage.setItem('goodpay_user', JSON.stringify(currentUser));
      document.getElementById('newEmailInput').value = '';
    } else {
      showToast(data.message || 'ইমেইল পরিবর্তন ব্যর্থ হয়েছে', 'danger');
    }
  } catch (err) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'danger');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('goodpay_user');
  localStorage.removeItem('goodpay_card');
  currentUser = null;
  currentCard = null;
  renderAppView();
  showToast('লগ আউট সম্পন্ন হয়েছে', 'info');
});

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchMfsSettings();
  renderAppView();
});
