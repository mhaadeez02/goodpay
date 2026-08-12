/**
 * GoodPay - Luxury Obsidian Wave Visa Card Renderer Component
 * Inactive cards show only last 4 digits + expiry with activation CTA.
 */

export function renderVisaCard(card, options = {}) {
  const isFrozen = card.status === 'FROZEN';
  const isInactive = card.status === 'INACTIVE' || card.status === 'UNPURCHASED';
  const isProcessing = card.status === 'PROCESSING';
  const isDeactivated = isInactive || isProcessing || isFrozen;
  const lastFour = card.cardNumber ? card.cardNumber.replace(/\s/g, '').slice(-4) : '????';

  const cardHtml = `
    <div class="card-item-container" data-card-id="${card.id}">
      <div class="card-3d-wrapper">
        <div class="visa-card-inner luxury-obsidian-card ${card.type === 'PHYSICAL' ? 'physical-card' : ''} ${isDeactivated ? 'card-inactive-overlay' : ''}" id="visaCardInner_${card.id}">
          
          <!-- LUXURY METALLIC BLUE 3D WAVES BACKGROUND -->
          <svg class="visa-bg-waves" viewBox="0 0 420 265" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <radialGradient id="glow_${card.id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 70) rotate(90) scale(180)">
                ${isDeactivated ? '<stop stop-color="#64748B" stop-opacity="0.4"/><stop offset="1" stop-color="#334155" stop-opacity="0"/>' : '<stop stop-color="#38BDF8" stop-opacity="0.45"/><stop offset="1" stop-color="#0369A1" stop-opacity="0"/>'}
              </radialGradient>
              <linearGradient id="wave1_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                ${isDeactivated ? '<stop offset="0%" stop-color="#1E293B"/><stop offset="50%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/>' : '<stop offset="0%" stop-color="#081A38"/><stop offset="50%" stop-color="#143D75"/><stop offset="100%" stop-color="#050E1F"/>'}
              </linearGradient>
              <linearGradient id="wave2_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                ${isDeactivated ? '<stop offset="0%" stop-color="#1E293B"/><stop offset="35%" stop-color="#374151"/><stop offset="70%" stop-color="#4B5563"/><stop offset="100%" stop-color="#111827"/>' : '<stop offset="0%" stop-color="#0D3568"/><stop offset="35%" stop-color="#1F62B8"/><stop offset="70%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#0A1E3C"/>'}
              </linearGradient>
              <linearGradient id="wave3_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                ${isDeactivated ? '<stop offset="0%" stop-color="#293548"/><stop offset="50%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/>' : '<stop offset="0%" stop-color="#1E3A8A"/><stop offset="50%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#070E1E"/>'}
              </linearGradient>
              <filter id="shadow_${card.id}" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/>
              </filter>
            </defs>

            <!-- Ambient Glow -->
            <circle cx="300" cy="70" r="180" fill="url(#glow_${card.id})"/>

            <!-- Smooth 3D Flowing Ribbons -->
            <path d="M-20,75 C90,15 190,165 310,65 C370,25 410,55 450,95 L450,285 L-20,285 Z" fill="url(#wave1_${card.id})" opacity="0.85"/>
            <path d="M-20,115 C100,55 195,190 330,95 C390,45 425,75 450,115 L450,285 L-20,285 Z" fill="url(#wave2_${card.id})" filter="url(#shadow_${card.id})"/>
            <path d="M-20,155 C120,95 210,225 360,125 C400,95 430,115 450,145 L450,285 L-20,285 Z" fill="url(#wave3_${card.id})" opacity="0.6"/>
          </svg>

          <!-- FRONT OF LUXURY VISA CARD -->
          <div class="card-front">
            
            <!-- TOP ROW: BRAND LOGO & STATUS -->
            <div class="card-header-row">
              <div class="card-brand-tag" style="display:flex; align-items:center; gap:0.5rem;">
                <div style="font-family:var(--font-heading); font-weight:900; font-size:1.15rem; letter-spacing:0.1em; color:#fff; text-shadow: 0 2px 10px rgba(0,240,255,0.4);">
                  GOOD<span style="color:${isDeactivated ? '#94a3b8' : 'var(--accent-cyan)'};">PAY</span>
                </div>
              </div>

              ${isInactive ? `
                <div style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.5); padding:0.2rem 0.5rem; border-radius:20px; font-size:0.65rem; font-weight:800; color:#fca5a5; letter-spacing:0.08em;">
                  🔒 INACTIVE
                </div>
              ` : isProcessing ? `
                <div style="background:rgba(245,158,11,0.2); border:1px solid rgba(245,158,11,0.5); padding:0.2rem 0.5rem; border-radius:20px; font-size:0.65rem; font-weight:800; color:#fcd34d; letter-spacing:0.08em;">
                  ⏳ PROCESSING
                </div>
              ` : isFrozen ? `
                <div style="background:rgba(100,116,139,0.2); border:1px solid rgba(100,116,139,0.5); padding:0.2rem 0.5rem; border-radius:20px; font-size:0.65rem; font-weight:800; color:#cbd5e1; letter-spacing:0.08em;">
                  ❄️ FROZEN
                </div>
              ` : `
                <div style="font-family:var(--font-heading); font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:0.18em; text-transform:uppercase; text-shadow:0 1px 4px rgba(0,0,0,0.8);">
                  PREPAID
                </div>
              `}
            </div>

            <!-- CHIP & CONTACTLESS ROW -->
            <div style="display:flex; align-items:center; gap:0.75rem; margin: 0.4rem 0;">
              <div class="card-chip-silver" style="${isDeactivated ? 'filter: grayscale(1) brightness(0.6);' : ''}">
                <div class="chip-line horizontal"></div>
                <div class="chip-line vertical"></div>
                <div class="chip-center"></div>
              </div>

              ${!isDeactivated ? `
              <svg class="contactless-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round">
                <path d="M8.5 16.5a5 5 0 0 1 0-9"/>
                <path d="M12 19a8.5 8.5 0 0 1 0-14"/>
                <path d="M15.5 21.5a12 12 0 0 1 0-19"/>
              </svg>
              ` : ''}
            </div>

            <!-- CARD NUMBER: always masked, last 4 visible, copy locked if inactive -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin:0.3rem 0; background:rgba(0,0,0,0.25); padding:0.4rem 0.75rem; border-radius:10px; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.08);">
              <div class="card-number-display" id="cardNumber_${card.id}" style="margin:0; font-family:'Courier New', monospace; letter-spacing:0.15em; font-weight:700; color:${isDeactivated ? 'rgba(255,255,255,0.45)' : '#fff'}; font-size:clamp(1rem, 3.8vw, 1.25rem);">
                •••• •••• •••• ${lastFour}
              </div>
              ${!isDeactivated ? `
              <button class="btn-secondary" id="btnCopyCardNum_${card.id}" style="padding:0.25rem 0.55rem; font-size:0.8rem; background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25);" title="Copy 16-Digit Card Number">
                📋
              </button>
              ` : '<span style="font-size:0.7rem; color:rgba(255,255,255,0.3);">🔒</span>'}
            </div>

            <!-- FOOTER ROW: CARDHOLDER, CVV, EXPIRY, AND OFFICIAL VISA LOGO -->
            <div class="card-footer-row" style="display:flex; justify-content:space-between; align-items:flex-end;">
              <div>
                <div class="card-holder-name" style="font-family:var(--font-heading); font-weight:700; font-size:0.85rem; letter-spacing:0.1em; color:${isDeactivated ? 'rgba(255,255,255,0.45)' : '#fff'}; text-shadow:0 1px 3px rgba(0,0,0,0.8);">
                  ${card.cardholderName}
                </div>
                
                <div style="display:flex; align-items:center; gap:0.85rem; margin-top:0.25rem;">
                  <!-- Expiry Date — always visible -->
                  <div style="font-size:0.75rem; color:rgba(255,255,255,0.75);">
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">EXP:</span>
                    <strong style="color:${isInactive || isProcessing ? 'rgba(255,255,255,0.55)' : '#fff'}; margin-left:0.2rem;">${card.expiryDate}</strong>
                  </div>

                  <!-- CVV — locked if inactive -->
                  <div style="font-size:0.75rem; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:0.3rem;">
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.5); text-transform:uppercase;">CVV:</span>
                    ${isInactive || isProcessing ? `
                      <strong style="font-family:monospace; color:rgba(255,255,255,0.3); font-size:0.9rem;">🔒</strong>
                    ` : `
                      <strong id="cardCvv_${card.id}" style="font-family:monospace; color:#fff; font-size:0.9rem; letter-spacing:0.1em;">***</strong>
                      <button class="btn-secondary" id="btnToggleCvv_${card.id}" style="padding:0.1rem 0.35rem; font-size:0.65rem; background:rgba(255,255,255,0.1); border:none;" title="Show/Hide CVV">
                        👁️
                      </button>
                    `}
                  </div>
                </div>
              </div>

              <!-- VISA LOGO -->
              <div class="visa-logo-white" style="${isInactive || isProcessing ? 'filter: grayscale(1) brightness(0.5);' : ''}">
                <span class="visa-v">V</span><span class="visa-text">ISA</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      <!-- CARD QUICK ACTION BUTTONS -->
      ${isInactive ? `
        <!-- INACTIVE: show activation CTA only -->
        <div class="glass-card" id="cardActivationPanel_${card.id}" style="margin-top: 1rem; padding: 1rem 1.1rem; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.07);">
          <div style="font-size:0.82rem; color:#fca5a5; font-weight:700; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
            🔒 কার্ড ইনঅ্যাক্টিভ — অ্যাক্টিভেশন প্রয়োজন
          </div>

          <!-- Bangla breakdown rows -->
          <div style="display:flex; flex-direction:column; gap:0.45rem; margin-bottom:1rem; background:rgba(0,0,0,0.2); border-radius:10px; padding:0.75rem 0.9rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
              <span style="color:#94a3b8;">লোড করতে হবে</span>
              <strong style="color:#fff;" id="activationFeeDisplay_${card.id}">$8.00</strong>
            </div>
            <div style="height:1px; background:rgba(255,255,255,0.07);"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
              <span style="color:#94a3b8;">কার্ডের দাম (ফি)</span>
              <span style="color:#f87171;" id="activationCardFeeDisplay_${card.id}">−$3.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
              <span style="color:#94a3b8;">কার্ডে যোগ হবে</span>
              <span style="color:#4ade80;" id="activationCreditDisplay_${card.id}">+$5.00</span>
            </div>
          </div>

          <button class="btn-gold" style="width:100%; justify-content:center; font-size:0.9rem;" id="btnActivateCard_${card.id}">
            ⚡ কার্ড অ্যাক্টিভ করুন — <span id="activationFeeBtn_${card.id}">$8.00</span> পেমেন্ট করুন
          </button>
        </div>
      ` : isProcessing ? `
        <!-- PROCESSING: waiting for admin approval -->
        <div class="glass-card" style="margin-top: 1rem; padding: 1rem 1.1rem; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.07);">
          <div style="font-size:0.82rem; color:#fcd34d; font-weight:700; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
            ⏳ Activation Payment Under Review
          </div>
          <div style="font-size:0.77rem; color:var(--text-muted); line-height:1.5;">
            Your activation payment has been submitted and is awaiting admin approval. Your card will be activated shortly.
          </div>
        </div>
      ` : `
        <!-- ACTIVE: standard action buttons -->
        <div class="glass-card" style="margin-top: 1rem; padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-around; gap: 0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary" style="flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8rem; justify-content: center;" id="btnUnmask_${card.id}">
            👁️ Card No
          </button>

          <!-- TOP UP BUTTON (REDIRECTS TO RECHARGE PAGE) -->
          <button class="btn-gold" style="flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8rem; justify-content: center;" id="btnTopup_${card.id}">
            ⚡ Top Up
          </button>

          <button class="${isFrozen ? 'btn-primary' : 'btn-danger'}" style="flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8rem; justify-content: center;" id="btnFreeze_${card.id}">
            ${isFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
        </div>
      `}
    </div>
  `;

  return cardHtml;
}

export function attachVisaCardEvents(card, store, showToast, refreshCallback, onNavigateToRecharge, onNavigateToActivate) {
  const cardId = card.id;
  const isInactive = card.status === 'INACTIVE' || card.status === 'UNPURCHASED';
  const isProcessing = card.status === 'PROCESSING';

  // Update activation fee display dynamically from settings
  const settings = store.getSettings();
  const activationFeeUSD = settings.cardActivationFeeUSD || 8.00;
  const creditUSD = settings.cardBalanceCreditUSD || 5.00;
  const cardFeeUSD = parseFloat((activationFeeUSD - creditUSD).toFixed(2));

  const feeDisplay = document.getElementById(`activationFeeDisplay_${cardId}`);
  const feeBtnDisplay = document.getElementById(`activationFeeBtn_${cardId}`);
  const cardFeeDisplay = document.getElementById(`activationCardFeeDisplay_${cardId}`);
  const creditDisplay = document.getElementById(`activationCreditDisplay_${cardId}`);

  if (feeDisplay) feeDisplay.textContent = `$${activationFeeUSD.toFixed(2)}`;
  if (feeBtnDisplay) feeBtnDisplay.textContent = `$${activationFeeUSD.toFixed(2)}`;
  if (cardFeeDisplay) cardFeeDisplay.textContent = `−$${cardFeeUSD.toFixed(2)}`;
  if (creditDisplay) creditDisplay.textContent = `+$${creditUSD.toFixed(2)}`;

  // Activation button
  const activateBtn = document.getElementById(`btnActivateCard_${cardId}`);
  if (activateBtn) {
    activateBtn.addEventListener('click', () => {
      if (typeof onNavigateToActivate === 'function') {
        onNavigateToActivate(activationFeeUSD);
      }
    });
  }

  if (isInactive || isProcessing) return; // Don't attach active-only events

  const copyNumBtn = document.getElementById(`btnCopyCardNum_${cardId}`);
  if (copyNumBtn) {
    copyNumBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(card.cardNumber.replace(/\s+/g, ''));
      showToast(`Card number copied: ${card.cardNumber}`);
    });
  }

  const toggleCvvBtn = document.getElementById(`btnToggleCvv_${cardId}`);
  const cvvEl = document.getElementById(`cardCvv_${cardId}`);
  if (toggleCvvBtn && cvvEl) {
    let revealed = false;
    toggleCvvBtn.addEventListener('click', () => {
      revealed = !revealed;
      cvvEl.textContent = revealed ? card.cvv : '***';
      toggleCvvBtn.textContent = revealed ? '🙈' : '👁️';
    });
  }

  const unmaskBtn = document.getElementById(`btnUnmask_${cardId}`);
  const cardNumEl = document.getElementById(`cardNumber_${cardId}`);
  if (unmaskBtn && cardNumEl) {
    let unmasked = false;
    unmaskBtn.addEventListener('click', () => {
      unmasked = !unmasked;
      cardNumEl.textContent = unmasked ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`;
      unmaskBtn.innerHTML = unmasked ? '🙈 Hide No' : '👁️ Card No';
    });
  }

  const topupBtn = document.getElementById(`btnTopup_${cardId}`);
  if (topupBtn) {
    topupBtn.addEventListener('click', () => {
      if (typeof onNavigateToRecharge === 'function') onNavigateToRecharge();
    });
  }

  const freezeBtn = document.getElementById(`btnFreeze_${cardId}`);
  if (freezeBtn) {
    freezeBtn.addEventListener('click', () => {
      const isFrozen = card.status === 'FROZEN';
      const newStatus = isFrozen ? 'ACTIVE' : 'FROZEN';
      store.updateCard(cardId, { status: newStatus });
      card.status = newStatus;
      showToast(isFrozen ? '✅ Card unfrozen successfully.' : '🔒 Card frozen temporarily.');
      if (typeof refreshCallback === 'function') refreshCallback();
    });
  }
}
