/**
 * GoodPay - Authentication Component (Login & Registration)
 * Styled directly for inside the Mobile App screen container.
 */

export function renderAuthScreen(activeTab = 'login') {
  return `
    <div class="auth-mobile-container">
      
      <!-- Brand Header inside Mobile Screen -->
      <div class="auth-header" style="margin-top: 0.5rem; margin-bottom: 1.25rem;">
        <div class="auth-brand-logo">
          <div class="brand-icon" style="width: 44px; height: 44px; font-size: 1.4rem; border-radius: 13px;">G</div>
          <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 900; letter-spacing: 0.05em; color: #fff;">
            Good<span style="color: var(--accent-cyan);">Pay</span>
          </div>
        </div>
        <div class="auth-subtitle" style="font-size: 0.78rem;">Global Visa Prepaid Card & Instant MFS Reloads</div>
      </div>

      <!-- Auth Tabs Switcher -->
      <div class="auth-tabs">
        <button class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}" id="authTabLoginBtn">
          🔑 Log In
        </button>
        <button class="auth-tab-btn ${activeTab === 'register' ? 'active' : ''}" id="authTabRegisterBtn">
          📝 Create Account
        </button>
      </div>

      <!-- Notification / Error Box -->
      <div id="authAlertBox" style="display: none; padding: 0.65rem 0.85rem; border-radius: 10px; font-size: 0.8rem; margin-bottom: 1rem; font-weight: 500;"></div>

      <!-- LOGIN FORM -->
      <form id="authLoginForm" style="${activeTab === 'login' ? 'display: flex;' : 'display: none;'}; flex-direction: column; gap: 0.85rem;">
        <div class="form-group">
          <label class="form-label" style="font-size: 0.78rem; color: #CBD5E1; font-weight: 600;">
            📱 Phone Number or Username
          </label>
          <div class="input-with-icon">
            <span class="input-icon">👤</span>
            <input 
              type="text" 
              id="loginIdentifier" 
              class="form-control auth-input" 
              placeholder="e.g. 017XXXXXXXX or Username" 
              required 
              autocomplete="username"
            >
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <label class="form-label" style="font-size: 0.78rem; color: #CBD5E1; font-weight: 600; margin: 0;">
              🔒 Password
            </label>
          </div>
          <div class="input-with-icon">
            <span class="input-icon">🔑</span>
            <input 
              type="password" 
              id="loginPassword" 
              class="form-control auth-input" 
              placeholder="Enter your password" 
              required 
              autocomplete="current-password"
            >
            <button type="button" class="password-toggle-btn" id="btnToggleLoginPass" title="Show/Hide Password">
              👁️
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary auth-submit-btn" id="btnLoginSubmit" style="margin-top: 0.25rem;">
          <span>Log In to GoodPay</span>
          <span style="font-size: 1.05rem;">➔</span>
        </button>

        <div style="text-align: center; margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-muted);">
          Don't have an account? 
          <a href="javascript:void(0)" id="linkSwitchToRegister" style="color: var(--accent-cyan); font-weight: 700; text-decoration: none;">
            Create Account
          </a>
        </div>
      </form>

      <!-- REGISTRATION FORM (NAME, PHONE NUMBER, PASSWORD) -->
      <form id="authRegisterForm" style="${activeTab === 'register' ? 'display: flex;' : 'display: none;'}; flex-direction: column; gap: 0.85rem;">
        
        <div class="form-group">
          <label class="form-label" style="font-size: 0.78rem; color: #CBD5E1; font-weight: 600;">
            👤 Full Name
          </label>
          <div class="input-with-icon">
            <span class="input-icon">🏷️</span>
            <input 
              type="text" 
              id="regFullName" 
              class="form-control auth-input" 
              placeholder="Enter your name" 
              required 
              autocomplete="name"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 0.78rem; color: #CBD5E1; font-weight: 600;">
            📱 Phone Number
          </label>
          <div class="input-with-icon">
            <span class="input-icon">📞</span>
            <input 
              type="tel" 
              id="regPhone" 
              class="form-control auth-input" 
              placeholder="e.g. 01712345678" 
              required 
              autocomplete="tel"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 0.78rem; color: #CBD5E1; font-weight: 600;">
            🔒 Password
          </label>
          <div class="input-with-icon">
            <span class="input-icon">🔐</span>
            <input 
              type="password" 
              id="regPassword" 
              class="form-control auth-input" 
              placeholder="Enter password" 
              required 
              autocomplete="new-password"
            >
            <button type="button" class="password-toggle-btn" id="btnToggleRegPass" title="Show/Hide Password">
              👁️
            </button>
          </div>
        </div>

        <button type="submit" class="btn-gold auth-submit-btn" id="btnRegisterSubmit" style="margin-top: 0.25rem;">
          <span>Create Account & Get Card</span>
          <span style="font-size: 1.05rem;">💳</span>
        </button>

        <div style="text-align: center; margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-muted);">
          Already have an account? 
          <a href="javascript:void(0)" id="linkSwitchToLogin" style="color: var(--accent-cyan); font-weight: 700; text-decoration: none;">
            Log In
          </a>
        </div>
      </form>

    </div>
  `;
}

export function attachAuthEvents(store, showToast, onAuthSuccess) {
  let activeTab = 'login';

  const alertBox = document.getElementById('authAlertBox');
  const loginForm = document.getElementById('authLoginForm');
  const registerForm = document.getElementById('authRegisterForm');
  const tabLoginBtn = document.getElementById('authTabLoginBtn');
  const tabRegisterBtn = document.getElementById('authTabRegisterBtn');

  const showAlert = (msg, isError = true) => {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    if (isError) {
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      alertBox.style.color = '#FCA5A5';
      alertBox.innerHTML = `⚠️ ${msg}`;
    } else {
      alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
      alertBox.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      alertBox.style.color = '#6EE7B7';
      alertBox.innerHTML = `✅ ${msg}`;
    }
  };

  const clearAlert = () => {
    if (alertBox) alertBox.style.display = 'none';
  };

  const switchTab = (tab) => {
    activeTab = tab;
    clearAlert();
    if (tab === 'login') {
      tabLoginBtn?.classList.add('active');
      tabRegisterBtn?.classList.remove('active');
      if (loginForm) loginForm.style.display = 'flex';
      if (registerForm) registerForm.style.display = 'none';
    } else {
      tabLoginBtn?.classList.remove('active');
      tabRegisterBtn?.classList.add('active');
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'flex';
    }
  };

  tabLoginBtn?.addEventListener('click', () => switchTab('login'));
  tabRegisterBtn?.addEventListener('click', () => switchTab('register'));
  document.getElementById('linkSwitchToRegister')?.addEventListener('click', () => switchTab('register'));
  document.getElementById('linkSwitchToLogin')?.addEventListener('click', () => switchTab('login'));

  // Password Visibility Toggles
  const setupToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁️';
      });
    }
  };

  setupToggle('btnToggleLoginPass', 'loginPassword');
  setupToggle('btnToggleRegPass', 'regPassword');

  // Handle Login Submit
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const identifier = document.getElementById('loginIdentifier')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const submitBtn = document.getElementById('btnLoginSubmit');

    if (!identifier || !password) {
      showAlert('Please enter your Phone/Username and Password.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Logging In...</span> ⏳';
    }

    const res = await store.login({ identifier, password });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Log In to GoodPay</span> <span style="font-size:1.05rem;">➔</span>';
    }

    if (res.success) {
      showAlert('Login successful! Redirecting...', false);
      showToast(`Welcome back, ${res.user.name}!`);
      setTimeout(() => {
        if (typeof onAuthSuccess === 'function') onAuthSuccess(res.user);
      }, 300);
    } else {
      showAlert(res.message || 'Invalid credentials. Please try again.');
    }
  });

  // Handle Register Submit (Name, Phone Number, Password)
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = document.getElementById('regFullName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const submitBtn = document.getElementById('btnRegisterSubmit');

    if (!name) {
      showAlert('Please enter your Name.');
      return;
    }

    if (!phone) {
      showAlert('Please enter your Phone Number.');
      return;
    }

    if (!password) {
      showAlert('Please enter your Password.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating Account...</span> ⏳';
    }

    const res = await store.register({ name, phone, password });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account & Get Card</span> <span style="font-size:1.05rem;">💳</span>';
    }

    if (res.success) {
      showAlert('Account created successfully! Redirecting to your card...', false);
      showToast(`Welcome to GoodPay, ${res.user.name}!`);
      setTimeout(() => {
        if (typeof onAuthSuccess === 'function') onAuthSuccess(res.user);
      }, 400);
    } else {
      showAlert(res.message || 'Registration failed. Please check your information.');
    }
  });
}
