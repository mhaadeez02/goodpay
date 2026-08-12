/* GoodPay v2.0.0.1 - Admin Panel Application Logic */

const API_BASE = '/api';

const buildUrl = (endpoint, actionName, params = {}) => {
  let url = `${API_BASE}/${endpoint}`;
  const keys = Object.keys(params);
  if (keys.length > 0) {
    const qs = keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    url += `?${qs}`;
  }
  return url;
};

// Global Admin State & Pagination (10 per page)
let currentAdmin = JSON.parse(localStorage.getItem('goodpay_admin')) || null;
let allUsers = [];
let filteredUsers = [];
let usersCurrentPage = 1;
const usersPerPage = 10;
const selectedUserIds = new Set();

let allRequests = [];
let requestsCurrentPage = 1;
const requestsPerPage = 10;
const selectedRequestKeys = new Set();

let mfsConfig = {};

// DOM Elements
const adminAuthScreen = document.getElementById('adminAuthScreen');
const adminDashboardLayout = document.getElementById('adminDashboardLayout');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminThemeToggleBtn = document.getElementById('adminThemeToggleBtn');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const adminSidebar = document.getElementById('adminSidebar');
const adminToastContainer = document.getElementById('adminToastContainer');

// Init Theme
const initAdminTheme = () => {
  const savedTheme = localStorage.getItem('goodpay_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
};

const updateThemeIcon = (theme) => {
  if (adminThemeToggleBtn) {
    adminThemeToggleBtn.innerHTML = theme === 'dark'
      ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
};

adminThemeToggleBtn?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('goodpay_theme', nextTheme);
  updateThemeIcon(nextTheme);
});

// Sidebar Collapse / Expand Toggle
sidebarToggleBtn?.addEventListener('click', () => {
  adminSidebar?.classList.toggle('collapsed');
});

// Toast Notifications
const showAdminToast = (message, type = 'info') => {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
};

// Admin Login Handler
adminLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('adminUsernameInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value.trim();

  try {
    const res = await fetch(buildUrl('admin/login', 'admin_login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      currentAdmin = data.admin;
      localStorage.setItem('goodpay_admin', JSON.stringify(currentAdmin));
      showAdminToast('Welcome Admin Masud!', 'success');
      renderAdminDashboard();
    } else {
      showAdminToast(data.message || 'Login failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
});

// Admin Logout
window.adminLogout = () => {
  localStorage.removeItem('goodpay_admin');
  currentAdmin = null;
  renderAdminDashboard();
  showAdminToast('Logged out of Admin Panel', 'info');
};

document.getElementById('adminLogoutBtn')?.addEventListener('click', window.adminLogout);

// Navigation Tabs in Admin Panel
const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-admin-tab]');
const tabContents = document.querySelectorAll('.admin-tab-content');
const pageTitle = document.getElementById('pageTitle');

sidebarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-admin-tab');
    sidebarBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.style.display = 'none');

    btn.classList.add('active');
    const activeSection = document.getElementById(targetTab);
    if (activeSection) activeSection.style.display = 'block';

    if (targetTab === 'adminUsersTab') {
      if (pageTitle) pageTitle.innerText = 'Registered Users';
      loadAdminUsers();
    } else if (targetTab === 'adminRequestsTab') {
      if (pageTitle) pageTitle.innerText = 'Recharge & Purchase Requests';
      loadAdminRequests();
    } else if (targetTab === 'adminMfsTab') {
      if (pageTitle) pageTitle.innerText = 'MFS Configuration';
      loadMfsSettings();
    } else if (targetTab === 'adminSettingsTab') {
      if (pageTitle) pageTitle.innerText = 'Admin Settings';
    }
  });
});

// ==========================================
// 1. USERS TAB & BULK DELETE LOGIC
// ==========================================

const updateUsersSelectionUI = () => {
  const count = selectedUserIds.size;
  const countSpan = document.getElementById('selectedUsersCount');
  const bulkBtn = document.getElementById('bulkDeleteUsersBtn');
  const selectAll = document.getElementById('selectAllUsers');

  if (countSpan) countSpan.innerText = count;
  if (bulkBtn) {
    if (count > 0) {
      bulkBtn.style.opacity = '1';
      bulkBtn.style.cursor = 'pointer';
      bulkBtn.title = `Delete ${count} selected user(s)`;
    } else {
      bulkBtn.style.opacity = '0.7';
      bulkBtn.style.cursor = 'pointer';
      bulkBtn.title = 'Select users to delete';
    }
  }

  const start = (usersCurrentPage - 1) * usersPerPage;
  const pageUsers = filteredUsers.slice(start, start + usersPerPage);
  if (selectAll) {
    if (pageUsers.length > 0 && pageUsers.every(u => selectedUserIds.has(Number(u.id)))) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else if (pageUsers.some(u => selectedUserIds.has(Number(u.id)))) {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
  }
};

window.toggleUserCheck = (id, isChecked) => {
  const uid = Number(id);
  if (isChecked) {
    selectedUserIds.add(uid);
  } else {
    selectedUserIds.delete(uid);
  }
  updateUsersSelectionUI();
};

window.toggleSelectAllUsers = (isChecked) => {
  const start = (usersCurrentPage - 1) * usersPerPage;
  const pageUsers = filteredUsers.slice(start, start + usersPerPage);
  if (isChecked) {
    pageUsers.forEach(u => selectedUserIds.add(Number(u.id)));
  } else {
    pageUsers.forEach(u => selectedUserIds.delete(Number(u.id)));
  }
  renderPaginatedUsersTable();
};

window.bulkDeleteUsers = async () => {
  if (selectedUserIds.size === 0) {
    showAdminToast('দয়া করে অন্তত ১ জন ইউজার নির্বাচন করুন (Please select at least 1 user)', 'danger');
    return;
  }

  const count = selectedUserIds.size;
  const confirmed = confirm(`সতর্কতা: আপনি কি নিশ্চিত যে ${count} জন ইউজারকে মুছে ফেলতে চান?\n\nইউজারদের মুছে দিলে তাদের ভার্চুয়াল কার্ড ও পূর্বের সকল রিচার্জ/পারচেজ রেকর্ডও ডাটাবেস থেকে ডিলিট হবে।`);
  if (!confirmed) return;

  try {
    const res = await fetch(buildUrl('admin/users/bulk-delete', 'admin_users_bulk_delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: Array.from(selectedUserIds) })
    });
    const data = await res.json();
    if (data.success) {
      selectedUserIds.clear();
      showAdminToast(data.message || 'Users deleted successfully', 'success');
      loadAdminUsers();
    } else {
      showAdminToast(data.message || 'Delete failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

window.deleteSingleUser = async (userId, phone) => {
  const confirmed = confirm(`আপনি কি নিশ্চিত যে ইউজার #${userId} (${phone}) মুছে ফেলতে চান?`);
  if (!confirmed) return;

  try {
    const res = await fetch(buildUrl('admin/users/bulk-delete', 'admin_users_bulk_delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [Number(userId)] })
    });
    const data = await res.json();
    if (data.success) {
      selectedUserIds.delete(Number(userId));
      showAdminToast(data.message || 'User deleted', 'success');
      loadAdminUsers();
    } else {
      showAdminToast(data.message || 'Delete failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

// Load Users
const loadAdminUsers = async () => {
  try {
    const res = await fetch(buildUrl('admin/users', 'admin_users'));
    const data = await res.json();
    if (data.success) {
      allUsers = data.users || [];
      filteredUsers = [...allUsers];
      usersCurrentPage = 1;
      renderPaginatedUsersTable();
    }
  } catch (err) {
    console.error("Users load error:", err);
  }
};

// Render Paginated Users Table (10 per page)
const renderPaginatedUsersTable = () => {
  const tbody = document.getElementById('usersTableBody');
  const prevBtn = document.getElementById('usersPrevBtn');
  const nextBtn = document.getElementById('usersNextBtn');
  const pageInfo = document.getElementById('usersPageInfo');

  if (!tbody) return;

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));

  if (usersCurrentPage < 1) usersCurrentPage = 1;
  if (usersCurrentPage > totalPages) usersCurrentPage = totalPages;

  const start = (usersCurrentPage - 1) * usersPerPage;
  const pageUsers = filteredUsers.slice(start, start + usersPerPage);

  if (!pageUsers.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">No users registered yet</td></tr>`;
  } else {
    tbody.innerHTML = pageUsers.map(u => {
      const verifiedTag = u.is_verified == 1 
        ? '<span class="status-tag approved"><i class="fa-solid fa-check"></i> Verified</span>'
        : '<span class="status-tag rejected"><i class="fa-solid fa-xmark"></i> Unverified</span>';

      const cardStatus = u.card_status || 'unpurchased';
      const cardStatusTag = cardStatus === 'active' 
        ? '<span class="status-tag approved">Active</span>'
        : cardStatus === 'processing'
        ? '<span class="status-tag pending">Processing</span>'
        : '<span class="status-tag" style="background: var(--input-bg);">Unpurchased</span>';

      const isChecked = selectedUserIds.has(Number(u.id)) ? 'checked' : '';

      return `
        <tr>
          <td style="text-align: center;">
            <input type="checkbox" class="user-select-cb" data-id="${u.id}" ${isChecked} onchange="toggleUserCheck(${u.id}, this.checked)" style="cursor: pointer; width: 16px; height: 16px; vertical-align: middle;">
          </td>
          <td>#${u.id}</td>
          <td style="font-weight: 700;">${u.phone}</td>
          <td>${u.username || u.phone}</td>
          <td style="font-family: monospace;">${u.card_number || 'N/A'}</td>
          <td style="font-weight: 800; color: var(--primary);">$${parseFloat(u.balance || 0).toFixed(2)}</td>
          <td>${cardStatusTag}</td>
          <td>${verifiedTag}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-sm btn-info" onclick="openMasterProfile(${u.id})" title="Edit User">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button class="btn-sm btn-danger" onclick="deleteSingleUser(${u.id}, '${u.phone}')" style="padding: 6px 10px;" title="Delete User">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update Pagination Controls
  if (pageInfo) pageInfo.innerText = `Page ${usersCurrentPage} of ${totalPages} (${totalItems} Users)`;
  if (prevBtn) prevBtn.disabled = (usersCurrentPage <= 1);
  if (nextBtn) nextBtn.disabled = (usersCurrentPage >= totalPages);

  updateUsersSelectionUI();
};

// Users Pagination Button Listeners
document.getElementById('usersPrevBtn')?.addEventListener('click', () => {
  if (usersCurrentPage > 1) {
    usersCurrentPage--;
    renderPaginatedUsersTable();
  }
});

document.getElementById('usersNextBtn')?.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  if (usersCurrentPage < totalPages) {
    usersCurrentPage++;
    renderPaginatedUsersTable();
  }
});

// Search Users Filtering
document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  filteredUsers = allUsers.filter(u => 
    u.phone.toLowerCase().includes(query) ||
    (u.username && u.username.toLowerCase().includes(query)) ||
    (u.card_number && u.card_number.toLowerCase().includes(query))
  );
  usersCurrentPage = 1;
  renderPaginatedUsersTable();
});

document.getElementById('refreshUsersBtn')?.addEventListener('click', () => {
  selectedUserIds.clear();
  loadAdminUsers();
});

// ==========================================
// 2. MASTER USER PROFILE MODAL (FULL CRUD)
// ==========================================
const masterProfileModal = document.getElementById('masterProfileModal');

window.openMasterProfile = async (userId) => {
  try {
    const res = await fetch(buildUrl('admin/user-details', 'admin_user_details', { user_id: userId }));
    const data = await res.json();
    if (data.success) {
      const u = data.user;
      const c = data.card || {};
      const history = data.history || [];

      document.getElementById('masterUserId').value = u.id;
      document.getElementById('masterUsername').value = u.username || u.phone;
      document.getElementById('masterPhone').value = u.phone;
      document.getElementById('masterEmail').value = u.email || '';
      document.getElementById('masterPassword').value = u.password;
      document.getElementById('masterVerified').value = u.is_verified || 0;

      document.getElementById('masterCardNumber').value = c.card_number || '4532 8912 3456 1234';
      document.getElementById('masterCvv').value = c.cvv || '892';
      document.getElementById('masterExpiry').value = c.expiry_date || '08/31';
      document.getElementById('masterBalance').value = parseFloat(c.balance || 5).toFixed(2);
      document.getElementById('masterCardStatus').value = c.status || 'unpurchased';

      // Render Transaction History logs inside Master Modal
      const histContainer = document.getElementById('masterUserHistory');
      if (!history.length) {
        histContainer.innerHTML = '<div style="color: var(--text-muted);">No transaction logs for this user</div>';
      } else {
        histContainer.innerHTML = history.map(h => `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color);">
            <span><strong>${h.type === 'card_purchase' ? 'Card Purchase' : 'Recharge ($' + h.amount + ')'}</strong> (${h.payment_method})</span>
            <span>${h.total_bdt} BDT | <strong style="text-transform: uppercase;">${h.status}</strong></span>
          </div>
        `).join('');
      }

      masterProfileModal?.classList.add('active');
    } else {
      showAdminToast(data.message || 'Error fetching user details', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

// Close Modals
document.querySelectorAll('.closeModalBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    masterProfileModal?.classList.remove('active');
  });
});

// Master Form Submit (Update User & Card details)
document.getElementById('masterUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('masterUserId').value;
  const username = document.getElementById('masterUsername').value.trim();
  const phone = document.getElementById('masterPhone').value.trim();
  const email = document.getElementById('masterEmail').value.trim();
  const password = document.getElementById('masterPassword').value.trim();
  const is_verified = document.getElementById('masterVerified').value;

  const card_number = document.getElementById('masterCardNumber').value.trim();
  const cvv = document.getElementById('masterCvv').value.trim();
  const expiry_date = document.getElementById('masterExpiry').value.trim();
  const balance = parseFloat(document.getElementById('masterBalance').value) || 0;
  const card_status = document.getElementById('masterCardStatus').value;

  try {
    const res = await fetch(buildUrl('admin/user-update', 'admin_user_update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        username, phone, email, password, is_verified,
        card_number, cvv, expiry_date, balance, card_status
      })
    });
    const data = await res.json();
    if (data.success) {
      masterProfileModal?.classList.remove('active');
      showAdminToast(data.message, 'success');
      loadAdminUsers();
    } else {
      showAdminToast(data.message || 'Update failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
});

// ==========================================
// 3. RECHARGE & PURCHASE REQUESTS + BULK DELETE
// ==========================================

const updateRequestsSelectionUI = () => {
  const count = selectedRequestKeys.size;
  const countSpan = document.getElementById('selectedRequestsCount');
  const bulkBtn = document.getElementById('bulkDeleteRequestsBtn');
  const selectAll = document.getElementById('selectAllRequests');

  if (countSpan) countSpan.innerText = count;
  if (bulkBtn) {
    if (count > 0) {
      bulkBtn.style.opacity = '1';
      bulkBtn.style.cursor = 'pointer';
      bulkBtn.title = `Delete ${count} selected record(s)`;
    } else {
      bulkBtn.style.opacity = '0.7';
      bulkBtn.style.cursor = 'pointer';
      bulkBtn.title = 'Select requests to delete';
    }
  }

  const start = (requestsCurrentPage - 1) * requestsPerPage;
  const pageRequests = allRequests.slice(start, start + requestsPerPage);
  if (selectAll) {
    if (pageRequests.length > 0 && pageRequests.every(r => selectedRequestKeys.has(`${r.request_type}_${r.id}`))) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else if (pageRequests.some(r => selectedRequestKeys.has(`${r.request_type}_${r.id}`))) {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
  }
};

window.toggleRequestCheck = (key, isChecked) => {
  if (isChecked) {
    selectedRequestKeys.add(key);
  } else {
    selectedRequestKeys.delete(key);
  }
  updateRequestsSelectionUI();
};

window.toggleSelectAllRequests = (isChecked) => {
  const start = (requestsCurrentPage - 1) * requestsPerPage;
  const pageRequests = allRequests.slice(start, start + requestsPerPage);
  if (isChecked) {
    pageRequests.forEach(r => selectedRequestKeys.add(`${r.request_type}_${r.id}`));
  } else {
    pageRequests.forEach(r => selectedRequestKeys.delete(`${r.request_type}_${r.id}`));
  }
  renderPaginatedRequestsTable();
};

window.bulkDeleteRequests = async () => {
  if (selectedRequestKeys.size === 0) {
    showAdminToast('দয়া করে অন্তত ১ টি রিকোয়েস্ট হিস্ট্রি নির্বাচন করুন (Please select at least 1 request)', 'danger');
    return;
  }

  const count = selectedRequestKeys.size;
  const confirmed = confirm(`আপনি কি নিশ্চিত যে ${count} টি রিকোয়েস্ট হিস্ট্রি রেকর্ড মুছে ফেলতে চান?`);
  if (!confirmed) return;

  const items = Array.from(selectedRequestKeys).map(k => {
    const parts = k.split('_');
    const id = parseInt(parts.pop());
    const type = parts.join('_');
    return { type, id };
  });

  try {
    const res = await fetch(buildUrl('admin/requests/bulk-delete', 'admin_requests_bulk_delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (data.success) {
      selectedRequestKeys.clear();
      showAdminToast(data.message || 'Requests deleted successfully', 'success');
      loadAdminRequests();
    } else {
      showAdminToast(data.message || 'Delete failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

window.deleteSingleRequest = async (type, id) => {
  const confirmed = confirm(`আপনি কি নিশ্চিত যে এই রিকোয়েস্ট রেকর্ডটি মুছে ফেলতে চান?`);
  if (!confirmed) return;

  try {
    const res = await fetch(buildUrl('admin/requests/bulk-delete', 'admin_requests_bulk_delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ type, id: Number(id) }] })
    });
    const data = await res.json();
    if (data.success) {
      selectedRequestKeys.delete(`${type}_${id}`);
      showAdminToast(data.message || 'Record deleted', 'success');
      loadAdminRequests();
    } else {
      showAdminToast(data.message || 'Delete failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

// Load Recharge Requests & Pending Card Purchases
const loadAdminRequests = async () => {
  try {
    const res = await fetch(buildUrl('admin/requests', 'admin_requests'));
    const data = await res.json();
    if (data.success) {
      allRequests = data.requests || [];
      requestsCurrentPage = 1;
      renderPaginatedRequestsTable();
    }
  } catch (err) {
    console.error("Requests load error:", err);
  }
};

// Render Paginated Requests Table (10 per page, NO VANISH on approve/reject!)
const renderPaginatedRequestsTable = () => {
  const tbody = document.getElementById('requestsTableBody');
  const badge = document.getElementById('requestsCountBadge');
  const prevBtn = document.getElementById('requestsPrevBtn');
  const nextBtn = document.getElementById('requestsNextBtn');
  const pageInfo = document.getElementById('requestsPageInfo');

  if (!tbody) return;

  // Count pending requests for badge count
  const pendingCount = allRequests.filter(r => r.status === 'pending').length;
  if (badge) {
    badge.innerText = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  const totalItems = allRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / requestsPerPage));

  if (requestsCurrentPage < 1) requestsCurrentPage = 1;
  if (requestsCurrentPage > totalPages) requestsCurrentPage = totalPages;

  const start = (requestsCurrentPage - 1) * requestsPerPage;
  const pageRequests = allRequests.slice(start, start + requestsPerPage);

  if (!pageRequests.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No requests recorded yet</td></tr>`;
  } else {
    tbody.innerHTML = pageRequests.map(r => {
      const isCard = r.request_type === 'card_purchase';
      const typeTag = isCard 
        ? '<span class="status-tag" style="background: #e0e7ff; color: #4338ca;"><i class="fa-solid fa-credit-card"></i> Card Purchase</span>'
        : '<span class="status-tag" style="background: #fef3c7; color: #d97706;"><i class="fa-solid fa-bolt"></i> Recharge</span>';

      const amtDisplay = isCard ? `${r.card_price} BDT` : `$${r.usd_amount} (${r.total_bdt} BDT)`;

      // Render Action Buttons or Status Badge (STAYS IN LIST, NO VANISH!)
      let actionColumn = '';
      if (r.status === 'pending') {
        actionColumn = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn-sm btn-success" onclick="approveRequest('${r.request_type}', ${r.id})">
              <i class="fa-solid fa-check"></i> Approve
            </button>
            <button class="btn-sm btn-danger" onclick="rejectRequest('${r.request_type}', ${r.id})">
              <i class="fa-solid fa-xmark"></i> Reject
            </button>
          </div>
        `;
      } else if (r.status === 'approved') {
        actionColumn = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="status-tag approved"><i class="fa-solid fa-check-circle"></i> Approved</span>
            <button class="btn-sm btn-danger" onclick="deleteSingleRequest('${r.request_type}', ${r.id})" style="padding: 4px 8px; font-size: 0.75rem;" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
      } else {
        actionColumn = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="status-tag rejected"><i class="fa-solid fa-times-circle"></i> Rejected</span>
            <button class="btn-sm btn-danger" onclick="deleteSingleRequest('${r.request_type}', ${r.id})" style="padding: 4px 8px; font-size: 0.75rem;" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
      }

      const reqKey = `${r.request_type}_${r.id}`;
      const isChecked = selectedRequestKeys.has(reqKey) ? 'checked' : '';

      return `
        <tr>
          <td style="text-align: center;">
            <input type="checkbox" class="request-select-cb" data-key="${reqKey}" ${isChecked} onchange="toggleRequestCheck('${reqKey}', this.checked)" style="cursor: pointer; width: 16px; height: 16px; vertical-align: middle;">
          </td>
          <td>${typeTag}</td>
          <td style="font-weight: 700;">${r.user_phone}</td>
          <td><strong>${r.payment_method}</strong></td>
          <td style="font-family: monospace; font-weight: 700;">${r.sender_number}</td>
          <td style="font-weight: 800; color: var(--primary);">${amtDisplay}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${r.created_at || ''}</td>
          <td>${actionColumn}</td>
        </tr>
      `;
    }).join('');
  }

  // Update Pagination Controls
  if (pageInfo) pageInfo.innerText = `Page ${requestsCurrentPage} of ${totalPages} (${totalItems} Total Records)`;
  if (prevBtn) prevBtn.disabled = (requestsCurrentPage <= 1);
  if (nextBtn) nextBtn.disabled = (requestsCurrentPage >= totalPages);

  updateRequestsSelectionUI();
};

// Requests Pagination Button Listeners
document.getElementById('requestsPrevBtn')?.addEventListener('click', () => {
  if (requestsCurrentPage > 1) {
    requestsCurrentPage--;
    renderPaginatedRequestsTable();
  }
});

document.getElementById('requestsNextBtn')?.addEventListener('click', () => {
  const totalPages = Math.ceil(allRequests.length / requestsPerPage);
  if (requestsCurrentPage < totalPages) {
    requestsCurrentPage++;
    renderPaginatedRequestsTable();
  }
});

document.getElementById('refreshRequestsBtn')?.addEventListener('click', () => {
  selectedRequestKeys.clear();
  loadAdminRequests();
});

// Approve Request Handler (STAYS IN LIST!)
window.approveRequest = async (request_type, request_id) => {
  try {
    const res = await fetch(buildUrl('admin/requests/approve', 'admin_approve'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_type, request_id })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message, 'success');
      loadAdminRequests();
    } else {
      showAdminToast(data.message || 'Approval failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

// Reject Request Handler (STAYS IN LIST!)
window.rejectRequest = async (request_type, request_id) => {
  try {
    const res = await fetch(buildUrl('admin/requests/reject', 'admin_reject'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_type, request_id })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message, 'info');
      loadAdminRequests();
    } else {
      showAdminToast(data.message || 'Rejection failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
};

// ==========================================
// 4. MFS SETTINGS
// ==========================================

const loadMfsSettings = async () => {
  try {
    const res = await fetch(buildUrl('mfs-settings', 'mfs_settings'));
    const data = await res.json();
    if (data.success && data.data) {
      mfsConfig = data.data;
      const bkash = document.getElementById('mfsBkashInput');
      const nagad = document.getElementById('mfsNagadInput');
      const rocket = document.getElementById('mfsRocketInput');
      const cardPrice = document.getElementById('mfsCardPriceInput');
      const activationFee = document.getElementById('mfsActivationFeeInput');
      const balanceCredit = document.getElementById('mfsBalanceCreditInput');
      const usdRate = document.getElementById('mfsUsdRateInput');
      const chargePct = document.getElementById('mfsChargePctInput');

      if (bkash) bkash.value = mfsConfig.bkash_number || '';
      if (nagad) nagad.value = mfsConfig.nagad_number || '';
      if (rocket) rocket.value = mfsConfig.rocket_number || '';
      if (cardPrice) cardPrice.value = mfsConfig.card_price_bdt || 1350;
      if (activationFee) activationFee.value = mfsConfig.card_activation_fee_usd || 8.00;
      if (balanceCredit) balanceCredit.value = mfsConfig.card_balance_credit_usd || 5.00;
      if (usdRate) usdRate.value = mfsConfig.usd_to_bdt_rate || 135;
      if (chargePct) chargePct.value = mfsConfig.cashout_charge_pct || 2;
    }
  } catch (err) {
    console.error("MFS settings load error:", err);
  }
};

document.getElementById('mfsSettingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bkash_number = document.getElementById('mfsBkashInput').value.trim();
  const nagad_number = document.getElementById('mfsNagadInput').value.trim();
  const rocket_number = document.getElementById('mfsRocketInput').value.trim();
  const card_price_bdt = parseFloat(document.getElementById('mfsCardPriceInput').value) || 1350;
  const card_activation_fee_usd = parseFloat(document.getElementById('mfsActivationFeeInput')?.value) || 8.00;
  const card_balance_credit_usd = parseFloat(document.getElementById('mfsBalanceCreditInput')?.value) || 5.00;
  const usd_to_bdt_rate = parseFloat(document.getElementById('mfsUsdRateInput').value) || 135;
  const cashout_charge_pct = parseFloat(document.getElementById('mfsChargePctInput').value) || 2;

  try {
    const res = await fetch(buildUrl('admin/mfs-update', 'admin_mfs_update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkash_number, nagad_number, rocket_number,
        card_price_bdt, card_activation_fee_usd, card_balance_credit_usd, usd_to_bdt_rate, cashout_charge_pct
      })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message, 'success');
    } else {
      showAdminToast(data.message || 'MFS update failed', 'danger');
    }
  } catch (err) {
    showAdminToast('Server connection error', 'danger');
  }
});

// Render Admin Dashboard
const renderAdminDashboard = () => {
  if (!currentAdmin) {
    if (adminAuthScreen) adminAuthScreen.style.display = 'flex';
    if (adminDashboardLayout) adminDashboardLayout.style.display = 'none';
    return;
  }

  if (adminAuthScreen) adminAuthScreen.style.display = 'none';
  if (adminDashboardLayout) adminDashboardLayout.style.display = 'flex';

  loadAdminUsers();
  loadAdminRequests();
  loadMfsSettings();
};

// Initialize Admin App
window.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  renderAdminDashboard();
});

// Database Status Polling
async function checkDBStatus() {
    try {
        const res = await fetch('/api/admin/status');
        const data = await res.json();
        
        const badge = document.getElementById('dbStatusBadge');
        const dot = document.getElementById('dbStatusDot');
        const text = document.getElementById('dbStatusText');
        
        if (data.status === 'connected') {
            badge.style.background = 'rgba(76, 175, 80, 0.1)';
            badge.style.borderColor = 'rgba(76, 175, 80, 0.3)';
            dot.style.background = '#4CAF50';
            dot.style.boxShadow = '0 0 8px #4CAF50';
            text.textContent = 'MongoDB: Connected';
        } else {
            badge.style.background = 'rgba(244, 67, 54, 0.1)';
            badge.style.borderColor = 'rgba(244, 67, 54, 0.3)';
            dot.style.background = '#F44336';
            dot.style.boxShadow = '0 0 8px #F44336';
            text.textContent = 'MongoDB: Disconnected';
        }
    } catch (err) {
        console.error('Failed to check DB status:', err);
    }
}

// Check on load and every 15 seconds
if (document.getElementById('dbStatusBadge')) {
    checkDBStatus();
    setInterval(checkDBStatus, 15000);
}
