// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Nav scroll
const navEl = document.querySelector('nav');
window.addEventListener('scroll', () => {
  navEl.classList.toggle('scrolled', window.scrollY > 50);
});
// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

function closeMobile() {
  mobileMenu.classList.remove('open');
}

function showComingSoon() {
  alert('NESH Robot — Coming Soon!');
}
// ── POMODORO PLAN GENERATOR ──
let selectedHours = null;
let schedule = [];
let currentBlockIndex = 0;
let timerInterval = null;
let timeRemaining = 0;
let isPaused = false;

const hourBtns = document.querySelectorAll('.hour-btn');
hourBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    hourBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedHours = parseFloat(btn.dataset.hours);
  });
});

const generatePlanBtn = document.getElementById('generatePlanBtn');
if (generatePlanBtn) {
  generatePlanBtn.addEventListener('click', () => {
    if (!selectedHours) {
      alert('Please select how many hours you are studying today!');
      return;
    }
    generateSchedule(selectedHours);
  });
}

function generateSchedule(hours) {
  const totalMinutes = hours * 60;
  const focusLength = 25;
  const shortBreak = 5;
  const longBreak = 15;

  schedule = [];
  let usedMinutes = 0;
  let sessionCount = 0;

  while (usedMinutes + focusLength <= totalMinutes) {
    sessionCount++;
    schedule.push({ type: 'focus', label: `Focus Session ${sessionCount}`, minutes: focusLength });
    usedMinutes += focusLength;

    if (usedMinutes + 5 > totalMinutes) break;

    const isLongBreak = sessionCount % 4 === 0;
    const breakLength = isLongBreak ? longBreak : shortBreak;

    if (usedMinutes + breakLength <= totalMinutes) {
      schedule.push({ type: 'break', label: isLongBreak ? 'Long Break' : 'Short Break', minutes: breakLength });
      usedMinutes += breakLength;
    }
  }

  document.getElementById('pomodoroSetup').style.display = 'none';
  document.getElementById('pomodoroResult').style.display = 'block';

  document.getElementById('planSummary').textContent =
    `${sessionCount} focus sessions planned for your ${hours} hour${hours > 1 ? 's' : ''} of study`;

  const scheduleEl = document.getElementById('planSchedule');
  scheduleEl.innerHTML = '';
  schedule.forEach(block => {
    const div = document.createElement('div');
    div.className = `schedule-block ${block.type}`;
    div.innerHTML = `<span>${block.label}</span><span>${block.minutes} min</span>`;
    scheduleEl.appendChild(div);
  });

  currentBlockIndex = 0;
}

const startTimerBtn = document.getElementById('startTimerBtn');
if (startTimerBtn) {
  startTimerBtn.addEventListener('click', () => {
    startTimerBtn.style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'block';
    startBlock(currentBlockIndex);
  });
}

function startBlock(index) {
  if (index >= schedule.length) {
    document.getElementById('timerLabel').textContent = 'All done!';
    document.getElementById('timerClock').textContent = '00:00';
    clearInterval(timerInterval);
    return;
  }

  const block = schedule[index];
  document.getElementById('timerLabel').textContent = block.label;
  timeRemaining = block.minutes * 60;
  updateClockDisplay();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeRemaining--;
      updateClockDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        currentBlockIndex++;
        startBlock(currentBlockIndex);
      }
    }
  }, 1000);
}

function updateClockDisplay() {
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const secs = (timeRemaining % 60).toString().padStart(2, '0');
  document.getElementById('timerClock').textContent = `${mins}:${secs}`;
}

const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
  pauseBtn.addEventListener('click', (e) => {
    isPaused = !isPaused;
    e.target.textContent = isPaused ? 'Resume' : 'Pause';
  });
}

const skipBtn = document.getElementById('skipBtn');
if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    currentBlockIndex++;
    startBlock(currentBlockIndex);
  });
}

const resetPlanBtn = document.getElementById('resetPlanBtn');
if (resetPlanBtn) {
  resetPlanBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    selectedHours = null;
    hourBtns.forEach(b => b.classList.remove('selected'));
    document.getElementById('pomodoroSetup').style.display = 'block';
    document.getElementById('pomodoroResult').style.display = 'none';
    document.getElementById('startTimerBtn').style.display = 'inline-block';
    document.getElementById('timerDisplay').style.display = 'none';
  });
}

// ── SIGNUP + LOGIN MODAL ──
// Wired directly to Supabase Auth (this project already uses Supabase for its
// database, so student accounts share the same project as everything else).
// The anon/public key is safe to ship in frontend code — Supabase's row-level
// security is what actually protects data, not secrecy of this key.
// Never put the service_role key here.
const SUPABASE_URL = 'https://zsdsqyowcjifbktbolji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHNxeW93Y2ppZmJrdGJvbGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzI2MzAsImV4cCI6MjA5NTk0ODYzMH0.k6FeqX_s7y4C662Do6ii9MkRSlkWMFzdF2Knvrwg3b8';

// Where Supabase sends the user after they click the email verification link.
// Update this the moment you have a real custom domain — and add the new URL
// to Supabase → Authentication → URL Configuration → Redirect URLs.
const SIGNUP_REDIRECT_URL = 'https://d2gtuofwzvtzpk.cloudfront.net/verified.html';

const signupOverlay = document.getElementById('signupOverlay');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const modalSuccess = document.getElementById('modalSuccess');
const modalSuccessText = document.getElementById('modalSuccessText');
const modalError = document.getElementById('modalError');
const loginError = document.getElementById('loginError');
const modalSubmit = document.getElementById('modalSubmit');
const loginSubmit = document.getElementById('loginSubmit');
const modalClose = document.getElementById('modalClose');
const modalDoneBtn = document.getElementById('modalDoneBtn');
const switchToLogin = document.getElementById('switchToLogin');
const switchToSignup = document.getElementById('switchToSignup');

function showForm(formToShow) {
  signupForm.style.display = 'none';
  loginForm.style.display = 'none';
  modalSuccess.style.display = 'none';
  modalError.classList.remove('visible');
  loginError.classList.remove('visible');
  formToShow.style.display = 'flex';
}

function openSignupModal(e) {
  if (e) e.preventDefault();
  signupOverlay.classList.add('open');
  signupForm.reset();
  showForm(signupForm);
}

function openLoginModal(e) {
  if (e) e.preventDefault();
  signupOverlay.classList.add('open');
  loginForm.reset();
  showForm(loginForm);
}

function closeSignupModal() {
  signupOverlay.classList.remove('open');
}

document.querySelectorAll('.js-signup-trigger').forEach(el => {
  el.addEventListener('click', openSignupModal);
});

document.querySelectorAll('.js-login-trigger').forEach(el => {
  el.addEventListener('click', openLoginModal);
});

switchToLogin.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); });
switchToSignup.addEventListener('click', (e) => { e.preventDefault(); showForm(signupForm); });

modalClose.addEventListener('click', closeSignupModal);

modalDoneBtn.addEventListener('click', async () => {
  const sessionRaw = localStorage.getItem('obscura_session');
  if (!sessionRaw) {
    closeSignupModal();
    return;
  }
  const session = JSON.parse(sessionRaw);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/student_profiles?id=eq.${session.user.id}&select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    const rows = await res.json().catch(() => []);
    window.location.href = (Array.isArray(rows) && rows.length > 0) ? 'dashboard.html' : 'onboarding.html';
  } catch (err) {
    window.location.href = 'onboarding.html';
  }
});

signupOverlay.addEventListener('click', (e) => {
  if (e.target === signupOverlay) closeSignupModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && signupOverlay.classList.contains('open')) closeSignupModal();
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  modalError.classList.remove('visible');
  modalSubmit.disabled = true;
  modalSubmit.textContent = 'Creating account...';

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(SIGNUP_REDIRECT_URL)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.msg || data.error_description || data.error || 'Something went wrong. Please try again.';
      throw new Error(message);
    }

    signupForm.style.display = 'none';
    modalSuccessText.textContent = data.session
      ? 'Your account is ready. Welcome to Obscura!'
      : 'Almost there — check your inbox to confirm your email.';
    modalSuccess.style.display = 'block';
  } catch (err) {
    modalError.textContent = err.message || 'Signup is not available right now — please try again shortly.';
    modalError.classList.add('visible');
  } finally {
    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Create Account';
  }
});

// Basic session storage so a logged-in user stays logged in across page
// reloads. The upcoming dashboard work will read this same key.
function storeSession(data) {
  if (data.access_token) {
    localStorage.setItem('obscura_session', JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user
    }));
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  loginError.classList.remove('visible');
  loginSubmit.disabled = true;
  loginSubmit.textContent = 'Logging in...';

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Supabase returns { error: "invalid_grant", error_description: "Invalid login credentials" }
      // for a wrong password/email, and a similar shape for an unconfirmed email.
      const message = data.msg || data.error_description || data.error || 'Login failed. Please try again.';
      throw new Error(message);
    }

    storeSession(data);

    loginForm.style.display = 'none';
    modalSuccessText.textContent = 'Welcome back! You\'re logged in.';
    modalSuccess.style.display = 'block';
  } catch (err) {
    loginError.textContent = err.message || 'Login is not available right now — please try again shortly.';
    loginError.classList.add('visible');
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = 'Log In';
  }
});
// ── NEWSLETTER POPUP ──
// Inserts into a separate Supabase table (not the auth system), so this is
// just an email capture, no account or confirmation email involved. Uses the
// same public anon key, protected by an insert-only RLS policy on the table.
const newsletterOverlay = document.getElementById('newsletterOverlay');
const newsletterForm = document.getElementById('newsletterForm');
const newsletterSuccess = document.getElementById('newsletterSuccess');
const newsletterError = document.getElementById('newsletterError');
const newsletterSubmit = document.getElementById('newsletterSubmit');
const newsletterClose = document.getElementById('newsletterClose');
const newsletterNoThanks = document.getElementById('newsletterNoThanks');

function closeNewsletterPopup() {
  newsletterOverlay.classList.remove('open');
}

setTimeout(() => {
  // Don't interrupt someone already mid-signup/login.
  if (!signupOverlay.classList.contains('open')) {
    newsletterOverlay.classList.add('open');
  }
}, 4000);

newsletterClose.addEventListener('click', closeNewsletterPopup);
newsletterNoThanks.addEventListener('click', (e) => {
  e.preventDefault();
  closeNewsletterPopup();
});
newsletterOverlay.addEventListener('click', (e) => {
  if (e.target === newsletterOverlay) closeNewsletterPopup();
});

newsletterForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('newsletterEmail').value.trim();

  newsletterError.classList.remove('visible');
  newsletterSubmit.disabled = true;
  newsletterSubmit.textContent = 'Subscribing...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Postgres unique_violation when the email already exists in the table.
      const message = res.status === 409
        ? "You're already on the list!"
        : (data.message || 'Something went wrong. Please try again.');
      throw new Error(message);
    }

    newsletterForm.style.display = 'none';
    newsletterSuccess.style.display = 'block';
  } catch (err) {
    newsletterError.textContent = err.message;
    newsletterError.classList.add('visible');
  } finally {
    newsletterSubmit.disabled = false;
    newsletterSubmit.textContent = 'Subscribe';
  }
});
// ── TESTIMONIALS CAROUSEL ──
const testimonialsTrack = document.getElementById('testimonialsTrack');
const testimonialPrev = document.getElementById('testimonialPrev');
const testimonialNext = document.getElementById('testimonialNext');

if (testimonialsTrack) {
  const scrollAmount = 320;
  testimonialPrev.addEventListener('click', () => {
    testimonialsTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  testimonialNext.addEventListener('click', () => {
    testimonialsTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}
// ── JOURNEY TIMELINE: scroll-fill line ──
const timelineFill = document.getElementById('timelineFill');
if (timelineFill) {
  const timelineEl = document.querySelector('.timeline');

  function updateTimelineFill() {
    const rect = timelineEl.getBoundingClientRect();
    const viewportCenter = window.innerHeight * 0.5;
    const scrolledPast = viewportCenter - rect.top;
    const percent = Math.max(0, Math.min(1, scrolledPast / rect.height));
    timelineFill.style.height = (percent * 100) + '%';
  }

  window.addEventListener('scroll', updateTimelineFill);
  window.addEventListener('resize', updateTimelineFill);
  updateTimelineFill();
}
// ── JOURNEY TIMELINE: image galleries ──
document.querySelectorAll('.timeline-gallery').forEach(gallery => {
  const track = gallery.querySelector('.timeline-gallery-track');
  const images = track.querySelectorAll('img');
  const total = images.length;

  if (total <= 1) {
    gallery.classList.add('single');
    return;
  }

  const counterCurrent = gallery.querySelector('.gallery-current');
  const counterTotal = gallery.querySelector('.gallery-total');
  const dotsWrap = gallery.querySelector('.gallery-dots');
  const prevBtn = gallery.querySelector('.gallery-arrow.prev');
  const nextBtn = gallery.querySelector('.gallery-arrow.next');
  let index = 0;

  counterTotal.textContent = total;

  images.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    counterCurrent.textContent = index + 1;
    dotsWrap.querySelectorAll('.gallery-dot').forEach((d, di) => {
      d.classList.toggle('active', di === index);
    });
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
});