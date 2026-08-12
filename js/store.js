/**
 * GoodPay - Central Data Store & Backend API Client
 * Manages real user authentication, card state, transactions, and MFS settings.
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'goodpay_active_user_session',
  USERS: 'goodpay_users_data',
  CARDS: 'goodpay_cards_data',
  DEPOSITS: 'goodpay_deposits_data',
  TRANSACTIONS: 'goodpay_transactions_data',
  SETTINGS: 'goodpay_settings_data'
};

const DEFAULT_SETTINGS = {
  exchangeRateBDT: 135.00,
  depositFeePercent: 2.0,
  virtualCardFeeUSD: 5.00,
  physicalCardFeeUSD: 15.00,
  cardPriceBDT: 1350.00,
  mfsNumbers: {
    bkash: { number: '01794146475', type: 'Personal (Send Money)', note: 'Send money to this personal bKash number' },
    nagad: { number: '01794146475', type: 'Personal (Send Money)', note: 'Send money to this personal Nagad number' },
    rocket: { number: '01794146475', type: 'Personal (Send Money)', note: 'Send money to this personal Rocket number' }
  }
};

class Store {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CARDS)) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) {
      localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }

    // Try fetching live MFS settings from backend
    this.fetchMfsSettings();
  }

  async fetchMfsSettings() {
    try {
      const res = await fetch('/api/mfs-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const settings = this.getSettings();
          settings.exchangeRateBDT = data.data.usd_to_bdt_rate || 135.00;
          settings.cardPriceBDT = data.data.card_price_bdt || 1350.00;
          settings.depositFeePercent = data.data.cashout_charge_pct || 2.0;
          settings.cardActivationFeeUSD = data.data.card_activation_fee_usd || 8.00;
          settings.cardBalanceCreditUSD = data.data.card_balance_credit_usd || 5.00;
          if (data.data.bkash_number) settings.mfsNumbers.bkash.number = data.data.bkash_number;
          if (data.data.nagad_number) settings.mfsNumbers.nagad.number = data.data.nagad_number;
          if (data.data.rocket_number) settings.mfsNumbers.rocket.number = data.data.rocket_number;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
          this.notifyChange('settings');
        }
      }
    } catch (e) {
      console.warn('Could not fetch remote MFS settings:', e);
    }
  }

  /** Re-fetch live card status + balance + verification from server and update localStorage. */
  async refreshFromServer() {
    const user = this.getCurrentUser();
    if (!user || !user.id) return;
    try {
      const res = await fetch(`/api/user/profile?user_id=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      let anythingChanged = false;

      // Sync user verification status
      if (data.user) {
        const serverVerified = !!data.user.is_verified;
        const localVerified = user.kycStatus === 'VERIFIED';
        if (serverVerified !== localVerified) {
          const updatedUser = {
            ...user,
            kycStatus: serverVerified ? 'VERIFIED' : 'PENDING',
            is_verified: serverVerified ? 1 : 0
          };
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
          anythingChanged = true;
        }
      }

      // Sync card status + balance from server
      if (data.card) {
        const serverCard = data.card;
        const cards = this.getCards();
        const idx = cards.findIndex(c => c.userId === user.id || c.userId === String(user.id));
        if (idx !== -1) {
          const serverStatus = (serverCard.status || 'inactive').toUpperCase();
          const serverBalance = parseFloat(serverCard.balance || 0);
          const cardChanged = cards[idx].status !== serverStatus || cards[idx].balanceUSD !== serverBalance;
          if (cardChanged) {
            cards[idx].status = serverStatus;
            cards[idx].balanceUSD = serverBalance;
            cards[idx].cvv = serverCard.cvv || cards[idx].cvv;
            cards[idx].cardNumber = serverCard.card_number || cards[idx].cardNumber;
            cards[idx].expiryDate = serverCard.expiry_date || cards[idx].expiryDate;
            localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
            // Also update user balance in session
            const currentUser = this.getCurrentUser();
            const updatedUser = { ...currentUser, balanceUSD: serverBalance };
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
            anythingChanged = true;
          }
        }
      }

      if (anythingChanged) {
        this.notifyChange('cards');
        this.notifyChange('currentUser');
      }
    } catch (e) {
      console.warn('Could not refresh from server:', e);
    }
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notifyChange('settings');
    return updated;
  }

  // ==========================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || !user.id) return null;
      return user;
    } catch (e) {
      return null;
    }
  }

  setCurrentUserSession(userData) {
    if (!userData) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
    }
    this.notifyChange('currentUser');
  }

  async register({ name, phone, email, password }) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name || phone,
          name: name || phone,
          phone,
          email,
          password
        })
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Registration failed' };
      }

      // Format user object for client
      const formattedUser = {
        id: data.user.id,
        name: data.user.username || name || 'GoodPay User',
        phone: data.user.phone,
        email: data.user.email || '',
        balanceUSD: data.card ? parseFloat(data.card.balance || 0) : 0.00,
        status: 'ACTIVE',
        kycStatus: data.user.is_verified ? 'VERIFIED' : 'PENDING',
        joinedDate: new Date().toISOString().split('T')[0]
      };

      this.setCurrentUserSession(formattedUser);

      // Save user to local user list
      const users = this.getUsers().filter(u => u.id !== formattedUser.id);
      users.push(formattedUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Save generated card
      if (data.card) {
        const cardObj = {
          id: 'crd_' + data.card.id,
          userId: formattedUser.id,
          type: 'VIRTUAL',
          cardNumber: data.card.card_number,
          cardholderName: (data.user.username || 'GOODPAY USER').toUpperCase(),
          expiryDate: data.card.expiry_date,
          cvv: data.card.cvv,
          balanceUSD: parseFloat(data.card.balance || 0),
          dailyLimitUSD: 500.00,
          status: (data.card.status || 'ACTIVE').toUpperCase(),
          createdAt: data.card.created_at || new Date().toISOString().split('T')[0]
        };

        const cards = this.getCards().filter(c => c.userId !== formattedUser.id);
        cards.push(cardObj);
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      }

      this.notifyChange('auth');
      return { success: true, user: formattedUser, message: data.message };
    } catch (e) {
      console.error('Registration error:', e);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  }

  async login({ identifier, password }) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const formattedUser = {
        id: data.user.id,
        name: data.user.username || data.user.phone || 'GoodPay User',
        phone: data.user.phone,
        email: data.user.email || '',
        balanceUSD: data.card ? parseFloat(data.card.balance || 0) : 0.00,
        status: 'ACTIVE',
        kycStatus: data.user.is_verified ? 'VERIFIED' : 'PENDING',
        joinedDate: data.user.created_at ? data.user.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
      };

      this.setCurrentUserSession(formattedUser);

      // Save user to local list
      const users = this.getUsers().filter(u => u.id !== formattedUser.id);
      users.push(formattedUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Save card if returned
      if (data.card) {
        const cardObj = {
          id: 'crd_' + data.card.id,
          userId: formattedUser.id,
          type: 'VIRTUAL',
          cardNumber: data.card.card_number,
          cardholderName: (data.user.username || 'GOODPAY USER').toUpperCase(),
          expiryDate: data.card.expiry_date,
          cvv: data.card.cvv,
          balanceUSD: parseFloat(data.card.balance || 0),
          dailyLimitUSD: 500.00,
          status: (data.card.status || 'ACTIVE').toUpperCase(),
          createdAt: data.card.created_at || new Date().toISOString().split('T')[0]
        };

        const cards = this.getCards().filter(c => c.userId !== formattedUser.id);
        cards.push(cardObj);
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      }

      this.notifyChange('auth');
      return { success: true, user: formattedUser, message: data.message };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notifyChange('auth');
    this.notifyChange('currentUser');
  }

  // ==========================================
  // USERS DATA
  // ==========================================

  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  }

  getUser(userId) {
    if (!userId) return null;
    return this.getUsers().find(u => u.id === userId || u.id === String(userId));
  }

  updateUser(userId, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId || u.id === String(userId));
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      const currentUser = this.getCurrentUser();
      if (currentUser && (currentUser.id === userId || currentUser.id === String(userId))) {
        this.setCurrentUserSession(users[index]);
      }

      this.notifyChange('users');
      return users[index];
    }
    return null;
  }

  // ==========================================
  // CARDS DATA
  // ==========================================

  getCards(userId = null) {
    const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS)) || [];
    if (userId) {
      return cards.filter(c => c.userId === userId || c.userId === String(userId));
    }
    return cards;
  }

  getCard(cardId) {
    return this.getCards().find(c => c.id === cardId);
  }

  updateCard(cardId, updates) {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = { ...cards[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      this.notifyChange('cards');
      return cards[index];
    }
    return null;
  }

  createCard(userId, type = 'VIRTUAL', customName = '') {
    const user = this.getUser(userId) || this.getCurrentUser();
    if (!user) return { success: false, message: 'User not found' };

    const existingCards = this.getCards(user.id);
    if (existingCards.length >= 1) {
      return { 
        success: false, 
        message: 'Account Card Limit Reached: Each user is allowed 1 Visa Card maximum (1 Person = 1 Card).' 
      };
    }

    const settings = this.getSettings();
    const fee = type === 'VIRTUAL' ? settings.virtualCardFeeUSD : settings.physicalCardFeeUSD;

    const random4 = () => Math.floor(1000 + Math.random() * 9000);
    const cardNumber = `4532 ${random4()} ${random4()} ${random4()}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const expYear = (new Date().getFullYear() + 3).toString().slice(-2);
    const expMonth = ('0' + (Math.floor(Math.random() * 12) + 1)).slice(-2);

    const newCard = {
      id: 'crd_' + Date.now().toString(36),
      userId: user.id,
      type,
      cardNumber,
      cardholderName: (customName || user.name).toUpperCase(),
      expiryDate: `${expMonth}/${expYear}`,
      cvv,
      balanceUSD: 0.00,
      dailyLimitUSD: type === 'VIRTUAL' ? 500 : 1000,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const cards = this.getCards();
    cards.push(newCard);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));

    this.addTransaction({
      userId: user.id,
      title: `${type === 'VIRTUAL' ? 'Virtual' : 'Physical'} Visa Card Created`,
      type: 'CARD_CREATED',
      amountUSD: 0.00,
      status: 'SUCCESS',
      date: new Date().toLocaleString(),
      details: `Card No: **** ${cardNumber.slice(-4)}`
    });

    this.notifyChange('cards');
    return { success: true, card: newCard };
  }

  // ==========================================
  // DEPOSITS & TRANSACTIONS
  // ==========================================

  getDeposits(userId = null) {
    const deposits = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPOSITS)) || [];
    if (userId) {
      return deposits.filter(d => d.userId === userId || d.userId === String(userId));
    }
    return deposits;
  }

  async submitDeposit({ userId, gateway, senderNumber, trxId, amountBDT, note }) {
    const user = this.getUser(userId) || this.getCurrentUser();
    if (!user) return { success: false, message: 'User not found' };

    const settings = this.getSettings();
    const rate = settings.exchangeRateBDT;
    const grossUSD = amountBDT / rate;
    const feeUSD = (grossUSD * settings.depositFeePercent) / 100;
    const netUSD = parseFloat((grossUSD - feeUSD).toFixed(2));

    try {
      // Submit to backend API
      fetch('/api/user/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          usd_amount: netUSD,
          payment_method: gateway,
          sender_number: senderNumber
        })
      }).catch(err => console.warn('Backend deposit sync error:', err));
    } catch (e) {
      console.warn(e);
    }

    const newDeposit = {
      id: 'dep_' + Date.now().toString(36),
      userId: user.id,
      userName: user.name,
      gateway,
      senderNumber,
      trxId: trxId.toUpperCase().trim(),
      amountBDT: parseFloat(amountBDT),
      amountUSD: netUSD,
      feeUSD: parseFloat(feeUSD.toFixed(2)),
      status: 'PENDING',
      createdAt: new Date().toLocaleString(),
      note: note || ''
    };

    const deposits = this.getDeposits();
    deposits.unshift(newDeposit);
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));

    this.addTransaction({
      userId: user.id,
      title: `${gateway.toUpperCase()} Deposit Submitted`,
      type: 'DEPOSIT_PENDING',
      amountUSD: netUSD,
      amountBDT: parseFloat(amountBDT),
      status: 'PENDING',
      date: new Date().toLocaleString(),
      details: `TrxID: ${newDeposit.trxId} (${senderNumber})`
    });

    this.notifyChange('deposits');
    return { success: true, deposit: newDeposit };
  }

  getTransactions(userId = null) {
    const txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    if (userId) {
      return txs.filter(t => t.userId === userId || t.userId === String(userId));
    }
    return txs;
  }

  addTransaction(txData) {
    const txs = this.getTransactions();
    const newTx = {
      id: 'tx_' + Date.now().toString(36),
      ...txData
    };
    txs.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    this.notifyChange('transactions');
    return newTx;
  }

  // ==========================================
  // SUBSCRIPTION SYSTEM
  // ==========================================

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyChange(type) {
    this.listeners.forEach(cb => {
      try {
        cb(type);
      } catch (e) {
        console.error('Store subscriber error:', e);
      }
    });
  }
}

export const store = new Store();
