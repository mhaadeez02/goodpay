/**
 * GoodPay - Supported Merchants & Platforms (Icon-Only Badges)
 * Renders icons without names as requested for the Card Page.
 */

export function renderSupportedMerchantIcons() {
  const merchants = [
    // Digital Wallets
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      category: 'Wallets',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M18.7 16.3c0-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.4 1-4.3 1s-2.3-1-3.7-1c-1.9 0-3.7 1.1-4.7 2.8-2 3.5-.5 8.7 1.4 11.5 1 1.4 2.1 2.9 3.6 2.8s2-.9 3.7-.9 2.2.9 3.7.9c1.6 0 2.6-1.4 3.5-2.8 1.1-1.6 1.6-3.2 1.6-3.3-.1 0-3.2-1.2-3.2-4.5zM15.8 8.1c.8-1 1.3-2.3 1.1-3.7-1.1.1-2.5.7-3.3 1.7-.7.8-1.3 2.2-1.1 3.5 1.3.1 2.5-.6 3.3-1.5z"/></svg>`,
      bg: '#000000',
      border: 'rgba(255,255,255,0.2)'
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      category: 'Wallets',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><path fill="#4285F4" d="M22.5 16.3c0-.6-.1-1.2-.2-1.8H16v3.4h3.6c-.2.9-.7 1.7-1.4 2.3v1.9h2.3c1.4-1.3 2-3.2 2-5.8z"/><path fill="#34A853" d="M16 23c1.9 0 3.5-.6 4.7-1.7l-2.3-1.9c-.6.4-1.4.7-2.4.7-1.8 0-3.4-1.2-3.9-2.9h-2.4v1.9C10.9 21.3 13.2 23 16 23z"/><path fill="#FBBC05" d="M12.1 17.2c-.1-.4-.2-.9-.2-1.2 0-.4.1-.8.2-1.2V12.9H9.7C9.2 13.9 9 14.9 9 16s.2 2.1.7 3.1l2.4-1.9z"/><path fill="#EA4335" d="M16 12.2c1 0 2 .4 2.7 1l2-2C19.5 10.1 17.9 9.5 16 9.5c-2.8 0-5.1 1.7-6.3 4.1l2.4 1.9c.5-1.7 2.1-3.3 3.9-3.3z"/></svg>`,
      bg: '#1E293B',
      border: 'rgba(66, 133, 244, 0.4)'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      category: 'Wallets',
      svg: `<svg viewBox="0 0 32 32" width="26" height="26"><path fill="#0079C1" d="M10 24.5l2.6-16.5h6.2c3.4 0 5.4 1.7 4.9 4.9-.6 3.8-3.1 5.8-6.5 5.8h-2.5l-1.5 9.4H10z"/><path fill="#00457C" d="M14.7 18.7l1.1-6.8h4.5c2.4 0 4.1 1.2 3.7 3.5-.5 2.7-2.3 4.1-4.7 4.1h-3.1l-1.5 9.5h-4.3l1.3-8.1v-2.2z"/></svg>`,
      bg: '#0F172A',
      border: 'rgba(0, 121, 193, 0.4)'
    },
    {
      id: 'alipay',
      name: 'Alipay',
      category: 'Wallets',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#1677FF"/><path fill="#fff" d="M7 13.5h18v2H19c-.3 2.5-1.5 4.8-3.3 6.6 2.3 1 4.9 1.7 7.3 1.9l-.6 2c-3.1-.3-6.1-1.3-8.7-2.7-2.5 1.5-5.5 2.4-8.7 2.7l-.6-2c2.4-.2 5-.9 7.3-1.9-1.5-1.5-2.6-3.5-3-5.9H7v-2.7zm5.5 0c.3 1.7 1 3.2 2 4.4 1-1.2 1.7-2.7 2-4.4h-4z"/></svg>`,
      bg: '#003A8C',
      border: 'rgba(22, 119, 255, 0.5)'
    },

    // E-Commerce
    {
      id: 'amazon',
      name: 'Amazon',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><path fill="#FF9900" d="M24.7 21.6c-4.8 3.5-11.8 3.9-16.7 1.4-.2-.1-.3-.4-.1-.6.5-.6 1.4-1.8 1.4-1.8.1-.1.3-.2.4-.1 4 2 10 1.7 14.1-1.2.3-.2.6.1.7.3.2.5.4 1.5.2 2z"/><path fill="#FF9900" d="M25.8 20.3c-.4-.5-2.5-.2-3.5.1-.3.1-.4-.2-.1-.4 1.8-1.3 3.6-.5 3.9-.1.3.4.1 2.3-1.5 3.7-.3.2-.5.1-.4-.2.4-1 .8-2.6 1.6-3.1z"/><path fill="#FFF" d="M16 8c-3.2 0-5.8 1.6-5.8 4.6 0 2.7 1.8 4.1 4.3 4.1 1.5 0 2.8-.7 3.5-1.8v1.5h2V12c0-2.8-1.8-4-4-4zm0 6.8c-1.4 0-2.3-1-2.3-2.5 0-1.7 1-2.5 2.3-2.5s2.3.9 2.3 2.5c0 1.5-.9 2.5-2.3 2.5z"/></svg>`,
      bg: '#131921',
      border: 'rgba(255, 153, 0, 0.4)'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="26" height="26"><path fill="#95BF47" d="M22.5 7.5L20.2 6c-.4-.3-.9-.2-1.1.2l-1.3 2.4-3.5.7c-.4.1-.7.4-.7.8l-.8 11.2 11.2 2.3 3.4-3.9-3.9-11.5c0-.2-.2-.5-.4-.6-.2-.1-.4-.1-.6.1z"/><path fill="#5E8E3E" d="M17.8 8.6L14.3 9.3c-.4.1-.7.4-.7.8l-.8 11.2 6.5 1.3 2.1-15-3.6 1.3z"/><path fill="#FFF" d="M18.8 13.7c-1.5.2-1.8 1.1-1.7 1.8.1.9 1 1.2 1.8 1.5 1.1.4 1.7.9 1.6 1.9-.1 1.3-1.3 1.9-2.6 1.8-1.4-.1-2.2-.8-2.2-.8l.4-1.3s.7.5 1.6.6c.7.1 1.1-.3 1.1-.7 0-.6-.7-.9-1.5-1.3-1-.5-1.7-1.1-1.6-2.1.1-1.3 1.2-2 2.4-2.1 1.1-.1 1.8.4 1.8.4l-.4 1.3s-.6-.4-1.3-.4z"/></svg>`,
      bg: '#0D2010',
      border: 'rgba(149, 191, 71, 0.4)'
    },
    {
      id: 'ebay',
      name: 'eBay',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><text x="3" y="21" font-family="'Outfit', sans-serif" font-weight="900" font-size="13" letter-spacing="-1"><tspan fill="#E53238">e</tspan><tspan fill="#0064D2">b</tspan><tspan fill="#F5AF02">a</tspan><tspan fill="#86B817">y</tspan></text></svg>`,
      bg: '#1E293B',
      border: 'rgba(255,255,255,0.15)'
    },
    {
      id: 'aliexpress',
      name: 'AliExpress',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#FF4747"/><path fill="#FFF" d="M9 10h14v13H9z" fill-opacity="0.2"/><path fill="#FFF" d="M12 9c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v1h-8V9zm4 4c-3.3 0-6 2.2-6 5s2.7 5 6 5 6-2.2 6-5-2.7-5-6-5zm0 8c-2.2 0-4-1.3-4-3s1.8-3 4-3 4 1.3 4 3-1.8 3-4 3z"/></svg>`,
      bg: '#4A0D0D',
      border: 'rgba(255, 71, 71, 0.4)'
    },
    {
      id: 'shopee',
      name: 'Shopee',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#EE4D2D"/><path fill="#FFF" d="M16 7c-2.2 0-4 1.8-4 4h2c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.2-1.8-4-4-4zm-6 5l1.5 13h9L22 12H10zm6 10.5c-2.5 0-3.8-1.2-3.8-2.3h1.8c0 .5.7 1 2 1 1.1 0 1.8-.5 1.8-1.1 0-.7-.6-1-1.7-1.3-1.8-.4-3.2-1-3.2-2.3 0-1.3 1.3-2.3 3.1-2.3 2.1 0 3.3 1.1 3.4 2.1h-1.8c-.1-.5-.6-.9-1.6-.9-1 0-1.5.4-1.5.9 0 .6.5.9 1.6 1.1 2 .5 3.3 1.1 3.3 2.4 0 1.4-1.3 2.7-3.4 2.7z"/></svg>`,
      bg: '#3D150B',
      border: 'rgba(238, 77, 45, 0.4)'
    },
    {
      id: 'lazada',
      name: 'Lazada',
      category: 'E-Commerce',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#0F146D"/><path fill="#F36F24" d="M16 8l5 6-5 6-5-6z"/><path fill="#0099FF" d="M16 14l5 6h-10z"/></svg>`,
      bg: '#080C3D',
      border: 'rgba(0, 153, 255, 0.4)'
    },

    // Advertisement & Media
    {
      id: 'facebook_ads',
      name: 'Facebook Ads',
      category: 'Ads',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="14" fill="#1877F2"/><path fill="#FFF" d="M18.2 16.5h2.5l.4-3.1h-2.9v-2c0-.9.2-1.5 1.5-1.5h1.6V7.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3h-2.7v3.1h2.7v7.8h3.2v-7.8z"/></svg>`,
      bg: '#0A2540',
      border: 'rgba(24, 119, 242, 0.4)'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      category: 'Ads',
      svg: `<svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="7" fill="#000"/><path fill="#25F4EE" d="M19.5 8.5c.7 1.1 1.8 1.9 3 2.1v2.8c-1.3-.1-2.4-.6-3.3-1.4v6.8c0 3.2-2.6 5.8-5.8 5.8s-5.8-2.6-5.8-5.8 2.6-5.8 5.8-5.8c.4 0 .7 0 1.1.1v3c-.3-.1-.7-.2-1.1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V6.2h3.2c0 .9.4 1.7 1 2.3z"/><path fill="#FE2C55" d="M20.2 9.2c.7 1 1.8 1.8 3 2v2.1c-1.3-.1-2.4-.6-3.3-1.4v6.8c0 3.2-2.6 5.8-5.8 5.8s-5.8-2.6-5.8-5.8 2.6-5.8 5.8-5.8c.4 0 .7 0 1.1.1v2.3c-.3-.1-.7-.1-1.1-.1-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V6.9h3.2v2.3z"/></svg>`,
      bg: '#050505',
      border: 'rgba(37, 244, 238, 0.3)'
    },
    {
      id: 'google_ads',
      name: 'Google Ads',
      category: 'Ads',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><path fill="#4285F4" d="M9.5 19.5l6.5-11.2c.6-1.1 2-1.5 3.1-.9l2.8 1.6c1.1.6 1.5 2 .9 3.1L16.3 23.3c-.6 1.1-2 1.5-3.1.9l-2.8-1.6c-1.1-.6-1.5-2-.9-3.1z"/><path fill="#FBBC04" d="M12.5 24.5l6.5-11.2c.6-1.1 2-1.5 3.1-.9l2.8 1.6c1.1.6 1.5 2 .9 3.1l-6.5 11.2c-.6 1.1-2 1.5-3.1.9l-2.8-1.6c-1.1-.6-1.5-2-.9-3.1z"/><circle cx="9.5" cy="22.5" r="3.5" fill="#34A853"/></svg>`,
      bg: '#172554',
      border: 'rgba(66, 133, 244, 0.4)'
    },

    // Cloud Platforms
    {
      id: 'aws',
      name: 'AWS',
      category: 'Cloud',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#232F3E"/><text x="6" y="16" fill="#FFF" font-family="'Outfit', sans-serif" font-weight="900" font-size="10">aws</text><path fill="#FF9900" d="M7 21c5.5 3 12.5 3 18 0-.3-.4-1.2-1-1.2-1-4.5 2.2-11.2 2.2-15.6 0 0 0-.8.7-1.2 1z"/></svg>`,
      bg: '#1A232E',
      border: 'rgba(255, 153, 0, 0.4)'
    },
    {
      id: 'google_cloud',
      name: 'Google Cloud',
      category: 'Cloud',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><path fill="#4285F4" d="M20.5 19h-9c-2.5 0-4.5-2-4.5-4.5S9 10 11.5 10c.5 0 1 .1 1.5.3C14 8 16.8 6.5 20 6.5c4.1 0 7.5 3.1 7.9 7.1 2.3.6 4.1 2.7 4.1 5.4 0 3-2.5 5.5-5.5 5.5h-6z"/><path fill="#34A853" d="M11.5 19h9c1.4 0 2.5-1.1 2.5-2.5S21.9 14 20.5 14h-1.2v-1.5c0-2.5-2-4.5-4.5-4.5-2.1 0-3.9 1.4-4.4 3.4L10 13c-1.7.3-3 1.8-3 3.5 0 1.9 1.6 3.5 3.5 3.5h1z"/></svg>`,
      bg: '#0F172A',
      border: 'rgba(66, 133, 244, 0.4)'
    },

    // Food & Ride Hailing
    {
      id: 'foodpanda',
      name: 'Foodpanda',
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#D70F64"/><circle cx="12" cy="12" r="3" fill="#FFF"/><circle cx="20" cy="12" r="3" fill="#FFF"/><ellipse cx="16" cy="18" rx="5.5" ry="4" fill="#FFF"/><circle cx="14" cy="17" r="1.2" fill="#D70F64"/><circle cx="18" cy="17" r="1.2" fill="#D70F64"/><ellipse cx="16" cy="19.5" rx="1.5" ry="1" fill="#D70F64"/></svg>`,
      bg: '#3B041B',
      border: 'rgba(215, 15, 100, 0.4)'
    },
    {
      id: 'mcdonalds',
      name: "McDonald's",
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#DA291C"/><path fill="#FFC72C" d="M8 23c0-4.5 1.8-8.5 4.5-8.5 2.1 0 3.5 2.2 3.5 5.5 0-3.3 1.4-5.5 3.5-5.5 2.7 0 4.5 4 4.5 8.5h-2.5c0-3.5-1.1-6.5-2.5-6.5-1.5 0-2.5 2.7-2.5 6.5h-2c0-3.8-1-6.5-2.5-6.5-1.4 0-2.5 3-2.5 6.5H8z"/></svg>`,
      bg: '#3A0B08',
      border: 'rgba(255, 199, 44, 0.4)'
    },
    {
      id: 'kfc',
      name: 'KFC',
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#A3080C"/><rect x="8" y="6" width="3" height="20" fill="#FFF"/><rect x="15" y="6" width="3" height="20" fill="#FFF"/><rect x="22" y="6" width="3" height="20" fill="#FFF"/><rect x="6" y="12" width="20" height="8" rx="2" fill="#A3080C"/><text x="7" y="18" fill="#FFF" font-family="'Outfit', sans-serif" font-weight="900" font-size="7">KFC</text></svg>`,
      bg: '#2B0406',
      border: 'rgba(163, 8, 12, 0.4)'
    },
    {
      id: 'starbucks',
      name: 'Starbucks',
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="14" fill="#006241"/><circle cx="16" cy="16" r="10" fill="none" stroke="#FFF" stroke-width="1.5"/><path fill="#FFF" d="M16 11l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-2-3 2 .5-3.5-2.5-2.5 3.5-.5z"/></svg>`,
      bg: '#002B1D',
      border: 'rgba(0, 98, 65, 0.4)'
    },
    {
      id: 'didi',
      name: 'DiDi',
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#FF7D00"/><path fill="#FFF" d="M10 10h5c3.3 0 6 2.7 6 6s-2.7 6-6 6h-5V10zm4 3.5v5h1c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5h-1z"/></svg>`,
      bg: '#3B1E00',
      border: 'rgba(255, 125, 0, 0.4)'
    },
    {
      id: 'keeta',
      name: 'KeeTa',
      category: 'Food/Ride',
      svg: `<svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#FFD000"/><text x="4" y="20" fill="#000" font-family="'Outfit', sans-serif" font-weight="900" font-size="8.5" letter-spacing="-0.5">KeeTa</text></svg>`,
      bg: '#3B3000',
      border: 'rgba(255, 208, 0, 0.4)'
    }
  ];

  return `
    <div class="glass-card" style="margin-top: 1.25rem; padding: 1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">
          Supported Everywhere
        </div>
        <span class="badge approved" style="font-size:0.65rem;">
          21+ Global Platforms
        </span>
      </div>

      <!-- ICON ONLY GRID (CLEAN, NO NAMES) -->
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 0.65rem; justify-items:center; align-items:center;">
        ${merchants.map(m => `
          <div class="merchant-icon-badge" title="${m.name}" style="width:44px; height:44px; border-radius:12px; background:${m.bg}; border:1px solid ${m.border}; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.4); transition:transform 0.2s ease, box-shadow 0.2s ease; cursor:pointer;" onmouseover="this.style.transform='translateY(-3px) scale(1.08)';" onmouseout="this.style.transform='translateY(0) scale(1)';">
            ${m.svg}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
