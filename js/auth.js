/**
 * RUSELL'S GLASS, WOODS & METALS - Authentication & OTP Security
 * Tabor Lumber Compound, Roxas Ext., Barangay Zone III, Digos City
 * "You NAME it, we BUILD it"
 * Workshop Point of Sale & Fabrication Management
 */

// Default Authorized Accounts for Owner, Front Office, and Workshop Personnel
const DEFAULT_USERS = [
  {
    username: 'owner',
    password: 'Admin123!',
    fullName: 'Russel T. (Proprietor)',
    phone: '0921-371-0555',
    email: 'irisjunetaborbajura@gmail.com',
    role: 'owner',
    roleLabel: 'Proprietor & General Manager',
    avatar: 'RT'
  },
  {
    username: 'sales',
    password: 'Sales123!',
    fullName: 'Iris June Tabor / Office Staff',
    phone: '0929-590-2201',
    email: 'irisjunetaborbajura@gmail.com',
    role: 'sales',
    roleLabel: 'Sales & Front Office',
    avatar: 'IJ'
  },
  {
    username: 'workshop',
    password: 'Craft123!',
    fullName: 'Arnel Mendoza (Lead Fabricator)',
    phone: '09053602201',
    email: 'fabrication@russelsworkshop.ph',
    role: 'fabricator',
    roleLabel: 'Workshop & Site Installer',
    avatar: 'AM'
  }
];

// Load or initialize user records
function getStoredUsers() {
  const stored = localStorage.getItem('russels_users');
  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      // Remove any legacy student proponent account
      parsed = parsed.filter(u => u.username.toLowerCase() !== 'jethro');
      
      // Clean up legacy emoji avatars
      parsed.forEach(u => {
        if (u.avatar === '🎓') u.avatar = 'RT';
        if (u.avatar === '👑') u.avatar = 'RT';
        if (u.avatar === '💼') u.avatar = 'IJ';
        if (u.avatar === '🛠️') u.avatar = 'AM';
        if (!u.avatar || u.avatar.length > 3) {
          u.avatar = (u.fullName || u.username || 'RT').substring(0, 2).toUpperCase();
        }
      });

      // Ensure primary owner exists
      if (!parsed.some(u => u.username === 'owner')) {
        parsed.unshift(DEFAULT_USERS[0]);
      }

      localStorage.setItem('russels_users', JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }
  localStorage.setItem('russels_users', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

function saveStoredUsers(users) {
  localStorage.setItem('russels_users', JSON.stringify(users));
}

// See Password Toggle Utility
function togglePasswordVisibility(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  if (btn) {
    const icon = btn.querySelector('.eye-icon');
    if (icon) {
      icon.innerHTML = isPassword 
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
    btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    btn.title = isPassword ? 'Hide Password' : 'Show Password';
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// Quick demo helper
function fillCredentials(username, password) {
  const u = document.getElementById('username');
  const p = document.getElementById('password');
  if (u && p) {
    u.value = username;
    p.value = password;
    u.focus();
  }
}

// ==========================================
// OTP & FORGOT PASSWORD ENGINE
// ==========================================
let currentOTP = null;
let otpChannel = 'sms';
let selectedUsername = 'owner';
let otpTimerInterval = null;
let resendSeconds = 45;

function openForgotModal() {
  const modal = document.getElementById('forgotModal');
  if (!modal) return;
  modal.classList.add('active');
  goToStep(1);

  // Pre-select username if already typed on main form, otherwise default to owner
  const inputUser = document.getElementById('username');
  const recSel = document.getElementById('recoveryAccount');
  if (recSel) {
    if (inputUser && inputUser.value.trim()) {
      const match = Array.from(recSel.options).find(opt => opt.value.toLowerCase() === inputUser.value.trim().toLowerCase());
      if (match) recSel.value = match.value;
    } else {
      recSel.value = 'owner';
    }
  }
  updateRecoveryPreviews();
}

function updateRecoveryPreviews() {
  const recSel = document.getElementById('recoveryAccount');
  const uName = recSel ? recSel.value : 'owner';
  const users = getStoredUsers();
  const u = users.find(x => x.username.toLowerCase() === uName.toLowerCase()) || users[0];
  const smsPreview = document.getElementById('smsPreviewText');
  const emailSub = document.querySelector('#channelEmail .channel-sub');
  if (smsPreview && u) {
    const rawPhone = u.phone || '0921-371-0555';
    smsPreview.textContent = rawPhone.startsWith('+63') ? rawPhone : `+63 ${rawPhone}`;
  }
  if (emailSub && u) {
    emailSub.textContent = u.email || 'irisjunetaborbajura@gmail.com';
  }
}
window.updateRecoveryPreviews = updateRecoveryPreviews;

function closeForgotModal() {
  const modal = document.getElementById('forgotModal');
  if (modal) modal.classList.remove('active');
  if (otpTimerInterval) clearInterval(otpTimerInterval);
}

function selectChannel(ch) {
  otpChannel = ch;
  const smsCard = document.getElementById('channelSms');
  const emailCard = document.getElementById('channelEmail');
  if (smsCard && emailCard) {
    if (ch === 'sms') {
      smsCard.classList.add('active');
      emailCard.classList.remove('active');
    } else {
      emailCard.classList.add('active');
      smsCard.classList.remove('active');
    }
  }
}

function goToStep(stepNum) {
  const s1 = document.getElementById('step1');
  const s2 = document.getElementById('step2');
  const s3 = document.getElementById('step3');
  const d1 = document.getElementById('dot1');
  const d2 = document.getElementById('dot2');
  const d3 = document.getElementById('dot3');
  const l1 = document.getElementById('line1');
  const l2 = document.getElementById('line2');

  [s1, s2, s3].forEach(s => s && s.classList.remove('active'));
  [d1, d2, d3, l1, l2].forEach(el => el && el.classList.remove('active'));

  if (stepNum === 1) {
    s1.classList.add('active');
    d1.classList.add('active');
  } else if (stepNum === 2) {
    s2.classList.add('active');
    d1.classList.add('active');
    d2.classList.add('active');
    l1.classList.add('active');
    setupOtpInputs();
    const firstBox = document.getElementById('otp0');
    if (firstBox) setTimeout(() => firstBox.focus(), 100);
  } else if (stepNum === 3) {
    s3.classList.add('active');
    d1.classList.add('active');
    d2.classList.add('active');
    d3.classList.add('active');
    l1.classList.add('active');
    l2.classList.add('active');
    const np = document.getElementById('newPassword');
    if (np) setTimeout(() => np.focus(), 100);
  }
}

function sendOTP() {
  const recSel = document.getElementById('recoveryAccount');
  selectedUsername = recSel ? recSel.value : 'owner';

  const users = getStoredUsers();
  const targetUser = users.find(u => u.username.toLowerCase() === selectedUsername.toLowerCase()) || users[0];

  // Generate 6-digit random code
  currentOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Determine destination
  const rawPhone = targetUser.phone || '0921-371-0555';
  const targetDisplay = otpChannel === 'sms' 
    ? (rawPhone.startsWith('+63') ? rawPhone : `+63 ${rawPhone}`)
    : (targetUser.email || 'irisjunetaborbajura@gmail.com');

  const sentDisplay = document.getElementById('sentTargetDisplay');
  if (sentDisplay) sentDisplay.textContent = targetDisplay;

  // Configure simulated alert content
  const simSender = document.getElementById('simSender');
  const simBody = document.getElementById('simBody');
  const simCode = document.getElementById('simCodeDisplay');
  
  if (otpChannel === 'sms') {
    if (simSender) simSender.textContent = `[SMS GATEWAY to ${targetDisplay}]`;
    if (simBody) simBody.innerHTML = `Rusell's Workshop: Your One-Time Password is <strong id="simCodeDisplay" style="color: #38bdf8; font-size: 1.1rem; letter-spacing: 0.15em;">${currentOTP}</strong>. Valid for 5 minutes. Do not share.`;
    showSimToast('SMS Gateway Dispatch', `Sent OTP verification code [${currentOTP}] to mobile ${targetDisplay}`);
  } else {
    if (simSender) simSender.textContent = `[EMAIL SERVER to ${targetDisplay}]`;
    if (simBody) simBody.innerHTML = `Subject: Security Code for Rusell's Workshop Access. Your verification code is <strong id="simCodeDisplay" style="color: #38bdf8; font-size: 1.1rem; letter-spacing: 0.15em;">${currentOTP}</strong>.`;
    showSimToast('Email Server Dispatch', `Sent OTP verification code [${currentOTP}] to ${targetDisplay}`);
  }

  // Clear previous OTP inputs
  for (let i = 0; i < 6; i++) {
    const b = document.getElementById(`otp${i}`);
    if (b) b.value = '';
  }

  // Start countdown
  startResendTimer();

  // Transition to step 2
  goToStep(2);
}

function startResendTimer() {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  resendSeconds = 45;
  const resendBtn = document.getElementById('resendBtn');
  const timerCount = document.getElementById('timerCount');
  if (resendBtn) resendBtn.disabled = true;

  otpTimerInterval = setInterval(() => {
    resendSeconds--;
    if (timerCount) timerCount.textContent = resendSeconds;
    if (resendSeconds <= 0) {
      clearInterval(otpTimerInterval);
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Resend Code Now';
      }
    }
  }, 1000);
}

function setupOtpInputs() {
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById(`otp${i}`);
    if (!box) continue;

    box.onkeydown = (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        const prev = document.getElementById(`otp${i - 1}`);
        if (prev) {
          prev.focus();
          prev.value = '';
        }
      }
    };

    box.oninput = (e) => {
      const val = box.value.replace(/\D/g, '');
      box.value = val ? val[0] : '';
      if (val && i < 5) {
        const next = document.getElementById(`otp${i + 1}`);
        if (next) next.focus();
      }
      if (i === 5 && val) {
        // Auto-verify if all 6 filled
        setTimeout(verifyOTP, 200);
      }
    };

    box.onpaste = (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = pasteData.replace(/\D/g, '').slice(0, 6);
      for (let j = 0; j < digits.length; j++) {
        const b = document.getElementById(`otp${j}`);
        if (b) b.value = digits[j];
      }
      if (digits.length === 6) {
        verifyOTP();
      }
    };
  }
}

function autoFillOTP() {
  if (!currentOTP) return;
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById(`otp${i}`);
    if (box) box.value = currentOTP[i] || '';
  }
  showSimToast('⚡ Auto-filled', `Inserted OTP ${currentOTP}`);
  setTimeout(verifyOTP, 250);
}

function verifyOTP() {
  const msg = document.getElementById('step2Msg');
  let entered = '';
  for (let i = 0; i < 6; i++) {
    const b = document.getElementById(`otp${i}`);
    entered += (b ? b.value : '');
  }

  if (entered.length < 6) {
    if (msg) {
      msg.className = 'message error';
      msg.textContent = 'Please enter all 6 digits of the OTP.';
      msg.style.display = 'block';
    }
    return;
  }

  if (entered === currentOTP) {
    if (msg) {
      msg.className = 'message success';
      msg.textContent = 'OTP verified successfully!';
      msg.style.display = 'block';
    }
    setTimeout(() => {
      if (msg) msg.style.display = 'none';
      goToStep(3);
    }, 500);
  } else {
    if (msg) {
      msg.className = 'message error';
      msg.textContent = 'Invalid verification code. Please check and try again.';
      msg.style.display = 'block';
    }
    // Shake inputs
    const inputsWrap = document.querySelector('.otp-digit-inputs');
    if (inputsWrap) {
      inputsWrap.style.animation = 'shake 0.4s ease';
      setTimeout(() => inputsWrap.style.animation = '', 400);
    }
  }
}

function checkStrength(pw) {
  const bar = document.getElementById('strengthBar');
  const txt = document.getElementById('strengthText');
  if (!bar || !txt) return;

  bar.className = 'pw-strength-fill';

  if (!pw) {
    txt.textContent = 'Strength: Enter password';
    txt.style.color = 'var(--text-white-dim)';
    return;
  }

  let strength = 0;
  if (pw.length >= 6) strength++;
  if (pw.length >= 8 && /[A-Z]/.test(pw)) strength++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) strength++;

  if (strength === 1) {
    bar.classList.add('weak');
    txt.textContent = 'Strength: Weak (Add uppercase, numbers & symbols)';
    txt.style.color = '#ef4444';
  } else if (strength === 2) {
    bar.classList.add('medium');
    txt.textContent = 'Strength: Medium (Good password)';
    txt.style.color = '#f59e0b';
  } else {
    bar.classList.add('strong');
    txt.textContent = 'Strength: Strong (Excellent security)';
    txt.style.color = '#22c55e';
  }
}

function resetPasswordAndLogin() {
  const newPw = document.getElementById('newPassword').value;
  const confPw = document.getElementById('confirmPassword').value;
  const msg = document.getElementById('step3Msg');

  if (!newPw || newPw.length < 6) {
    if (msg) {
      msg.className = 'message error';
      msg.textContent = 'Password must be at least 6 characters long.';
      msg.style.display = 'block';
    }
    return;
  }

  if (newPw !== confPw) {
    if (msg) {
      msg.className = 'message error';
      msg.textContent = 'Passwords do not match.';
      msg.style.display = 'block';
    }
    return;
  }

  // Update password in stored users
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === selectedUsername.toLowerCase());
  if (idx !== -1) {
    users[idx].password = newPw;
    saveStoredUsers(users);
  }

  if (msg) {
    msg.className = 'message success';
    msg.textContent = 'Password reset successfully! Logging you in...';
    msg.style.display = 'block';
  }

  showSimToast('✅ Password Updated', `New credentials saved for ${selectedUsername}`);

  // Create session and log in directly
  const activeUser = users[idx !== -1 ? idx : 0];
  const sessionData = {
    username: activeUser.username,
    fullName: activeUser.fullName,
    role: activeUser.role,
    roleLabel: activeUser.roleLabel,
    avatar: activeUser.avatar || '👤',
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem('russels_current_user', JSON.stringify(sessionData));

  setTimeout(() => {
    closeForgotModal();
    window.location.href = 'app.html';
  }, 1200);
}

function showSimToast(title, text) {
  const toast = document.getElementById('simToast');
  const tTitle = document.getElementById('toastTitle');
  const tMsg = document.getElementById('toastMessage');
  if (!toast) return;

  if (tTitle) tTitle.textContent = title;
  if (tMsg) tMsg.textContent = text;

  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4500);
}

// ==========================================
// REGULAR LOGIN FORM HANDLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  // Initialize users if needed
  getStoredUsers();

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = loginForm.username.value.trim();
      const password = loginForm.password.value;

      if (!username || !password) {
        showMessage('Please enter both username and password.', 'error');
        return;
      }

      const users = getStoredUsers();
      const matchedUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (matchedUser) {
        showMessage('Access granted! Loading Rusell\'s Workshop Workspace...', 'success');
        
        const sessionData = {
          username: matchedUser.username,
          fullName: matchedUser.fullName,
          role: matchedUser.role,
          roleLabel: matchedUser.roleLabel,
          avatar: matchedUser.avatar || '👤',
          loggedInAt: new Date().toISOString()
        };
        localStorage.setItem('russels_current_user', JSON.stringify(sessionData));

        setTimeout(() => {
          window.location.href = 'app.html';
        }, 700);
      } else {
        showMessage('Invalid username or password. Check credentials or use "Forgot password?".', 'error');
      }
    });
  }

  function showMessage(msg, type) {
    if (!loginMessage) return;
    loginMessage.className = `message ${type}`;
    loginMessage.textContent = msg;
    loginMessage.style.display = 'block';
  }
});

// Global auth service for app.html
window.AuthService = {
  getCurrentUser() {
    try {
      const data = localStorage.getItem('russels_current_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },
  logout() {
    localStorage.removeItem('russels_current_user');
    window.location.href = 'index.html';
  }
};
