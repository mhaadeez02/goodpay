/**
 * GoodPay - Two-Step Bangladeshi MFS Deposit Flow with Official Logos
 */
import { showAlert } from './dialog.js';

let depositStep = 'SELECT_METHOD'; // 'SELECT_METHOD' or 'PAYMENT_FORM'
let activeGateway = 'bkash'; // 'bkash', 'nagad', 'rocket'
let chosenBdtAmount = 2500;

export function renderMfsDepositView(store, user) {
  const settings = store.getSettings();
  const isActivationMode = !!window._cardActivationMode;
  const activationFeeUSD = window._cardActivationFeeUSD || settings.cardActivationFeeUSD || 8.00;
  const activationFeeBDT = Math.round(activationFeeUSD * (settings.exchangeRateBDT || 135));

  const brandInfo = {
    bkash: {
      name: 'bKash',
      bnName: 'বিকাশ',
      logo: 'assets/bkash.png',
      color: 'var(--accent-pink)',
      borderColor: 'rgba(226, 19, 110, 0.5)',
      typeText: 'Personal (Send Money)',
      instructions: 'Open your bKash app or dial *247# -> Choose "Send Money" -> Send money to the Admin Personal number below -> Enter your sender number.'
    },
    nagad: {
      name: 'Nagad',
      bnName: 'নগদ',
      logo: 'assets/nagad.png',
      color: 'var(--accent-orange)',
      borderColor: 'rgba(247, 147, 30, 0.5)',
      typeText: 'Personal (Send Money)',
      instructions: 'Open your Nagad app or dial *167# -> Choose "Send Money" -> Send money to the Admin Personal number below -> Enter your sender number.'
    },
    rocket: {
      name: 'Rocket',
      bnName: 'রকেট',
      logo: 'assets/rocket.png',
      color: 'var(--accent-purple)',
      borderColor: 'rgba(139, 68, 247, 0.5)',
      typeText: 'Personal (Send Money)',
      instructions: 'Open your Rocket app or dial *322# -> Choose "Send Money" -> Send money to the Admin Personal number below -> Enter your sender number.'
    }
  };

  const currentGw = brandInfo[activeGateway] || brandInfo.bkash;
  const adminNumberInfo = settings.mfsNumbers[activeGateway] || { number: '01794146475', note: '' };

  const grossUSD = isActivationMode ? activationFeeUSD : (chosenBdtAmount / settings.exchangeRateBDT);
  const feeUSD = isActivationMode ? 0 : (grossUSD * settings.depositFeePercent) / 100;
  const netUSD = isActivationMode ? activationFeeUSD.toFixed(2) : Math.max(0, grossUSD - feeUSD).toFixed(2);
  if (isActivationMode) chosenBdtAmount = activationFeeBDT;

  return `
    <div class="mfs-deposit-container">

      ${isActivationMode ? `
        <!-- CARD ACTIVATION MODE BANNER -->
        <div style="background: linear-gradient(135deg, rgba(234,179,8,0.12), rgba(14,19,31,0.9)); border: 1px solid rgba(234,179,8,0.4); border-radius: var(--radius-md); padding: 0.9rem 1.1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.85rem;">
          <div style="font-size: 1.6rem;">⚡</div>
          <div>
            <div style="font-weight: 800; color: #fde047; font-size: 0.92rem;">Card Activation Mode</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Send exactly <strong style="color: #fff;">৳${activationFeeBDT.toLocaleString()} BDT ($${activationFeeUSD.toFixed(2)} USD)</strong> via bKash / Nagad / Rocket to activate your card.</div>
          </div>
        </div>
      ` : ''}
      
      <!-- ===================================================================
           PAGE 1: ENTER AMOUNT (BDT) & SELECT PAYMENT GATEWAY
           =================================================================== -->
      <div id="depositPage1" style="${depositStep === 'SELECT_METHOD' ? 'display:block' : 'display:none'}">
        <div class="glass-card highlight-cyan">
          
          <div style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:1rem;">
            <div style="background:rgba(0, 240, 255, 0.1); border:1px solid rgba(0, 240, 255, 0.3); padding:0.35rem 0.75rem; border-radius:20px; font-size:0.75rem; color:var(--accent-cyan);">
              Exchange Rate: 1 USD = <strong>${settings.exchangeRateBDT} BDT</strong>
            </div>
          </div>

          <!-- DEPOSIT AMOUNT INPUT ON 1ST PAGE -->
          <div style="background:var(--bg-surface); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-glass); margin-bottom:1.25rem;">
            ${isActivationMode ? `
              <div style="display:flex; align-items:center; justify-content:space-between; padding: 0.75rem; background: rgba(234,179,8,0.07); border-radius: var(--radius-md); border: 1px solid rgba(234,179,8,0.2);">
                <div>
                  <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Activation Fee (Fixed)</div>
                  <div style="font-family:var(--font-heading); font-size:1.3rem; font-weight:800; color:#fde047;">৳${activationFeeBDT.toLocaleString()} BDT</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">USD</div>
                  <div style="font-family:var(--font-heading); font-size:1.3rem; font-weight:800; color:var(--accent-cyan);">$${activationFeeUSD.toFixed(2)}</div>
                </div>
              </div>
            ` : `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom:0.75rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-weight:700; color:#fff;">Deposit Amount (BDT)</label>
                <input type="number" class="form-input" id="inputBdtAmountPage1" placeholder="e.g. 2500" min="100" step="50" value="${chosenBdtAmount || ''}" style="font-size:1.1rem; font-weight:700;" required />
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-weight:700; color:var(--accent-cyan);">You Will Receive (Net USD)</label>
                <input type="text" class="form-input" id="inputUsdCalculatedPage1" placeholder="$0.00" value="$${netUSD}" readonly style="background:rgba(0, 240, 255, 0.08); color:var(--accent-cyan); font-weight:800; font-size:1.1rem;" />
              </div>
            </div>

            <!-- Quick Preset Amount Chips (only for regular deposits) -->
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem;">
              <button type="button" class="btn-secondary btn-preset-bdt" data-amount="1000" style="padding:0.3rem 0.65rem; font-size:0.75rem;">৳1,000</button>
              <button type="button" class="btn-secondary btn-preset-bdt" data-amount="2500" style="padding:0.3rem 0.65rem; font-size:0.75rem;">৳2,500</button>
              <button type="button" class="btn-secondary btn-preset-bdt" data-amount="5000" style="padding:0.3rem 0.65rem; font-size:0.75rem;">৳5,000</button>
              <button type="button" class="btn-secondary btn-preset-bdt" data-amount="10000" style="padding:0.3rem 0.65rem; font-size:0.75rem;">৳10,000</button>
            </div>
            `}
          </div>

          <label class="form-label" style="font-weight:700; margin-bottom:0.75rem;">Select Payment Gateway</label>

          <!-- 3 GATEWAY CARDS WITH OFFICIAL LOGOS -->
          <div style="display:flex; flex-direction:column; gap:0.85rem;">
            
            <!-- bKash Card -->
            <div class="glass-card btn-select-mfs-method" data-method="bkash" style="background:linear-gradient(135deg, rgba(226, 19, 110, 0.12) 0%, rgba(14, 19, 31, 0.9) 100%); border:1px solid rgba(226, 19, 110, 0.4); padding:1.1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.25s ease;">
              <div style="display:flex; align-items:center; gap:1rem;">
                <img src="assets/bkash.png" alt="bKash" style="width:48px; height:48px; border-radius:12px; object-fit:cover; box-shadow:0 4px 12px rgba(226, 19, 110, 0.3);" />
                <div>
                  <div style="font-family:var(--font-heading); font-size:1.15rem; font-weight:800; color:var(--accent-pink);">bKash</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Personal (Send Money)</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge approved" style="font-size:0.7rem;">SEND MONEY</span>
                <span style="font-size:1.2rem; color:var(--accent-pink); font-weight:700;">➜</span>
              </div>
            </div>

            <!-- Nagad Card -->
            <div class="glass-card btn-select-mfs-method" data-method="nagad" style="background:linear-gradient(135deg, rgba(247, 147, 30, 0.12) 0%, rgba(14, 19, 31, 0.9) 100%); border:1px solid rgba(247, 147, 30, 0.4); padding:1.1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.25s ease;">
              <div style="display:flex; align-items:center; gap:1rem;">
                <img src="assets/nagad.png" alt="Nagad" style="width:48px; height:48px; border-radius:12px; object-fit:cover; box-shadow:0 4px 12px rgba(247, 147, 30, 0.3);" />
                <div>
                  <div style="font-family:var(--font-heading); font-size:1.15rem; font-weight:800; color:var(--accent-orange);">Nagad</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Personal (Send Money)</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge approved" style="font-size:0.7rem;">SEND MONEY</span>
                <span style="font-size:1.2rem; color:var(--accent-orange); font-weight:700;">➜</span>
              </div>
            </div>

            <!-- Rocket Card -->
            <div class="glass-card btn-select-mfs-method" data-method="rocket" style="background:linear-gradient(135deg, rgba(139, 68, 247, 0.12) 0%, rgba(14, 19, 31, 0.9) 100%); border:1px solid rgba(139, 68, 247, 0.4); padding:1.1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.25s ease;">
              <div style="display:flex; align-items:center; gap:1rem;">
                <img src="assets/rocket.png" alt="Rocket" style="width:48px; height:48px; border-radius:12px; object-fit:cover; box-shadow:0 4px 12px rgba(139, 68, 247, 0.3);" />
                <div>
                  <div style="font-family:var(--font-heading); font-size:1.15rem; font-weight:800; color:var(--accent-purple);">Rocket</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Personal (Send Money)</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge approved" style="font-size:0.7rem;">SEND MONEY</span>
                <span style="font-size:1.2rem; color:var(--accent-purple); font-weight:700;">➜</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ===================================================================
           PAGE 2: BANGLA INSTRUCTIONS & CENTER-ALIGNED ADMIN NUMBER
           =================================================================== -->
      <div id="depositPage2" style="${depositStep === 'PAYMENT_FORM' ? 'display:block' : 'display:none'}">
        <div class="glass-card" style="border-color:${currentGw.borderColor};">
          
          <!-- Back Navigation Button -->
          <div style="margin-bottom:1.25rem;">
            <button class="btn-secondary" id="btnBackToMethods" style="padding:0.4rem 0.8rem; font-size:0.8rem;">
              ⬅️ Change Amount / Method
            </button>
          </div>

          <!-- Order Summary Pill with Official Logo -->
          <div class="glass-card" style="background:linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(14, 19, 31, 0.8) 100%); padding:1rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <img src="${currentGw.logo}" alt="${currentGw.name}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;" />
              <div>
                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Selected Gateway</div>
                <div style="font-family:var(--font-heading); font-weight:800; color:${currentGw.color}; font-size:1.15rem;">
                  ${currentGw.name} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">(Send Money)</span>
                </div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Send Money Amount</div>
              <div style="font-family:var(--font-heading); font-weight:800; color:#fff; font-size:1.2rem;">
                ৳${chosenBdtAmount.toLocaleString()} <span style="font-size:0.85rem; color:var(--accent-cyan);">($${netUSD} USD)</span>
              </div>
            </div>
          </div>

          <!-- BANGLA STEP-BY-STEP INSTRUCTIONS & CENTER-ALIGNED ADMIN NUMBER CARD -->
          <div class="glass-card" style="background:var(--bg-surface); border:1px solid ${currentGw.borderColor}; margin-bottom:1.25rem; padding:1.25rem;">
            
            <!-- 3-Step Bangla Instructions with Baloo Da 2 Mid-Range font -->
            <div style="background:rgba(255, 255, 255, 0.03); border:1px solid rgba(255, 255, 255, 0.08); padding:1.15rem; border-radius:var(--radius-md); margin-bottom:1.25rem; font-family:'Baloo Da 2', sans-serif; font-weight:500; font-size:1.05rem; line-height:1.75; color:#F1F5F9;">
              <div style="display:flex; align-items:flex-start; gap:0.6rem;">
                <span style="color:${currentGw.color}; font-weight:600; font-size:1.1rem;">১.</span>
                <span>নিচের <strong style="font-weight:600; color:#fff;">${currentGw.bnName || currentGw.name}</strong> নাম্বার টি কপি করুন</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:0.6rem; margin-top:0.45rem;">
                <span style="color:${currentGw.color}; font-weight:600; font-size:1.1rem;">২.</span>
                <span><strong style="font-weight:600; color:var(--accent-cyan);">৳${chosenBdtAmount.toLocaleString()}</strong> টাকা সেন্ড মানি করুন</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:0.6rem; margin-top:0.45rem;">
                <span style="color:${currentGw.color}; font-weight:600; font-size:1.1rem;">৩.</span>
                <span>যে নাম্বার থেকে টাকা পাঠিয়েছেন । সেই নাম্বারটি নিচে সাবমিট করুন ।</span>
              </div>
            </div>

            <!-- CENTER-ALIGNED ADMIN NUMBER DISPLAY & COPY BUTTON -->
            <div style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0.5rem 0;">
              <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; font-weight:600; margin-bottom:0.25rem;">
                Admin Personal ${currentGw.name} Number
              </div>

              <div style="font-family:var(--font-heading); font-size:clamp(1.5rem, 5vw, 1.9rem); font-weight:800; color:${currentGw.color}; letter-spacing:0.06em; margin-bottom:0.85rem; user-select:all;">
                ${adminNumberInfo.number}
              </div>

              <button class="btn-secondary" id="btnCopyAdminNumberStep2" style="font-size:0.9rem; padding:0.6rem 1.4rem; background:rgba(255,255,255,0.08); border-color:${currentGw.borderColor}; font-weight:700; border-radius:30px; display:inline-flex; align-items:center; gap:0.5rem; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
                📋 Copy Number
              </button>
            </div>

          </div>

          <!-- SENDER PHONE SUBMISSION FORM -->
          <form id="mfsDepositFormStep2">
            <div class="form-group">
              <label class="form-label" style="font-family:'Baloo Da 2', sans-serif; font-weight:600; font-size:0.95rem; color:#fff;">যে নাম্বার থেকে টাকা পাঠিয়েছেন</label>
              <input type="tel" class="form-input" id="inputSenderNumberStep2" placeholder="017xxxxxxxx" style="font-size:1.05rem;" required />
            </div>

            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:0.9rem; font-size:1rem; margin-top:0.5rem; font-family:'Baloo Da 2', sans-serif; font-weight:600; font-size:1.05rem;">
              ${isActivationMode ? `⚡ কার্ড টি কিনুন ।` : `🚀 Submit ৳${chosenBdtAmount.toLocaleString()} ${currentGw.name} Deposit`}
            </button>
          </form>
        </div>
      </div>

    </div>
  `;
}

export function attachMfsDepositEvents(store, user, showToast, refreshCallback) {
  const settings = store.getSettings();

  const updateCalculatedUsdPage1 = () => {
    const inputBdt = document.getElementById('inputBdtAmountPage1');
    const inputUsd = document.getElementById('inputUsdCalculatedPage1');
    if (!inputBdt || !inputUsd) return;

    const bdtVal = parseFloat(inputBdt.value) || 0;
    chosenBdtAmount = bdtVal;

    if (bdtVal <= 0) {
      inputUsd.value = '$0.00';
      return;
    }
    const grossUSD = bdtVal / settings.exchangeRateBDT;
    const feeUSD = (grossUSD * settings.depositFeePercent) / 100;
    inputUsd.value = `$${Math.max(0, grossUSD - feeUSD).toFixed(2)}`;
  };

  const inputBdtPage1 = document.getElementById('inputBdtAmountPage1');
  if (inputBdtPage1) {
    inputBdtPage1.addEventListener('input', updateCalculatedUsdPage1);
  }

  // Quick preset chips
  document.querySelectorAll('.btn-preset-bdt').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(btn.dataset.amount);
      if (inputBdtPage1) {
        inputBdtPage1.value = amount;
        updateCalculatedUsdPage1();
      }
    });
  });

  // Step 1: Click a payment gateway -> Validates amount & navigates to Step 2
  document.querySelectorAll('.btn-select-mfs-method').forEach(card => {
    card.addEventListener('click', async () => {
      const isActivMode = !!window._cardActivationMode;
      if (!isActivMode) {
        const amount = parseFloat(document.getElementById('inputBdtAmountPage1')?.value);
        if (!amount || amount < 100) {
          await showAlert('Please enter a valid deposit amount (Minimum ৳100 BDT) before selecting a payment gateway.', { title: 'Invalid Amount', type: 'warning', icon: '💰' });
          document.getElementById('inputBdtAmountPage1')?.focus();
          return;
        }
        chosenBdtAmount = amount;
      }

      activeGateway = card.dataset.method;
      depositStep = 'PAYMENT_FORM';
      if (refreshCallback) refreshCallback();
    });
  });

  // Step 2: Back button -> Navigates back to Step 1
  document.getElementById('btnBackToMethods')?.addEventListener('click', () => {
    depositStep = 'SELECT_METHOD';
    if (refreshCallback) refreshCallback();
  });

  // Copy Admin Number in Step 2
  document.getElementById('btnCopyAdminNumberStep2')?.addEventListener('click', () => {
    const info = settings.mfsNumbers[activeGateway] || { number: '01794146475' };
    navigator.clipboard.writeText(info.number);
    showToast(`${activeGateway.toUpperCase()} Admin Personal number copied: ${info.number}`);
  });

  // Form Submit Handler in Step 2
  const form = document.getElementById('mfsDepositFormStep2');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const senderNumber = document.getElementById('inputSenderNumberStep2').value.trim();
      const isActivationMode = !!window._cardActivationMode;
      const activationFeeUSD = window._cardActivationFeeUSD || settings.cardActivationFeeUSD || 8.00;
      const activationFeeBDT = Math.round(activationFeeUSD * (settings.exchangeRateBDT || 135));

      if (!senderNumber) {
        await showAlert('Please enter the mobile number you sent from.', { title: 'Sender Number Required', type: 'warning', icon: '📱' });
        return;
      }

      if (isActivationMode) {
        // Card Activation: call /api/user/buy-card
        try {
          const res = await fetch('/api/user/buy-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              full_name: user.name,
              phone_number: user.phone,
              payment_method: activeGateway,
              sender_number: senderNumber
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Activation payment submitted! Awaiting admin approval.');
            window._cardActivationMode = false;
            window._cardActivationFeeUSD = null;
            depositStep = 'SELECT_METHOD';
            const userCards = store.getCards(user.id);
            if (userCards.length > 0) {
              store.updateCard(userCards[0].id, { status: 'PROCESSING' });
            }
            if (refreshCallback) refreshCallback();
          } else {
            await showAlert(data.message || 'Activation failed.', { title: 'Activation Error', type: 'danger', icon: '🛡️' });
          }
        } catch (err) {
          await showAlert('Server connection error. Please try again.', { title: 'Connection Error', type: 'danger', icon: '📡' });
        }
      } else {
        // Normal deposit
        if (!chosenBdtAmount || chosenBdtAmount < 100) {
          await showAlert('Minimum deposit amount is ৳100 BDT.', { title: 'Invalid Amount', type: 'warning', icon: '💰' });
          return;
        }

        const autoTrxId = activeGateway.toUpperCase().slice(0, 3) + Date.now().toString(36).toUpperCase().slice(-6);

        const res = store.submitDeposit({
          userId: user.id,
          gateway: activeGateway,
          senderNumber,
          trxId: autoTrxId,
          amountBDT: chosenBdtAmount,
          note: `Personal Send Money from: ${senderNumber}`
        });

        if (res.success) {
          showToast('Deposit submitted! Check Transaction tab for live verification.');
          depositStep = 'SELECT_METHOD';
          if (refreshCallback) refreshCallback();
        } else {
          await showAlert(res.message || 'Deposit submission failed.', { title: 'Deposit Error', type: 'danger', icon: '⚠️' });
        }
      }
    });
  }
}
