const seed = {
  showSplash: true,
  isLoading: true,
  currentUser: null,
  authRole: "Student",
  authMode: "login",
  authStep: "role",
  activeTab: "Home",
  selectedEventId: "event-1",
  eventScreenMode: "list",
  eventCategoryFilter: "All",
  eventSearch: "",
  eventViewMode: "grid",
  eventSortBy: "date",
  regStatusFilter: "Pending",
  scanResult: "",
  cloudStatus: "Local demo mode",
  darkMode: false,
  adminUserSearch: "",
  sidebarCollapsed: false,
  notifDrawerOpen: false,
  mobileMenuOpen: false,
  isScanning: false,
  activeCameraId: null,
  upiModalOpen: false,
  upiModalEventId: null,
  upiPaymentStep: "qr", // "qr" | "confirm"
  upiTxnId: "",
  users: [
    { id: "stu-1", email: "student@campus.edu", name: "Aarav Mehta", role: "Student", rollNo: "CSE-204", branch: "Computer Science", year: "3", phoneNumber: "9876543210", skills: "UI, Python, Robotics" },
    { id: "coord-1", email: "coord@campus.edu", name: "Nisha Rao", role: "Coordinator", department: "Computer Science", coordinatingCategory: "Technical" },
    { id: "admin-1", email: "admin@campus.edu", name: "Priya Shah", role: "Admin", department: "Student Affairs" }
  ],
  events: [
    { id: "event-1", name: "TechnoCraft Hack Sprint", category: "Technical", date: "Jul 18", time: "10:00 AM", venue: "Innovation Lab", description: "A rapid prototyping sprint for student teams building helpful campus technology.", rules: "Teams of 2-4. Bring laptops. Final demo is mandatory.", schedule: "Briefing | Build sprint | Mentor review | Demo showcase", entryFee: 150, createdBy: "coord-1", capacity: 80 },
    { id: "event-2", name: "TechnoCraft Cultural Stage", category: "Cultural", date: "Jul 22", time: "6:30 PM", venue: "Open Air Theater", description: "Music, dance, and stage performances from every department.", rules: "Approved passes only. Entry opens 45 minutes early.", schedule: "Solo acts | Group dance | Band finale", entryFee: 0, createdBy: "coord-1", capacity: 220 },
    { id: "event-3", name: "TechnoCraft Robo Race", category: "Sports", date: "Jul 25", time: "6:00 AM", venue: "Main Ground", description: "A high-energy campus race with timing, checkpoints, and certificates.", rules: "Closed shoes required. Medical desk opens at 5:30 AM.", schedule: "Warmup | Flagged start | Medal desk", entryFee: 80, createdBy: "coord-1", capacity: 140 },
    { id: "event-4", name: "TechnoCraft Career Lab", category: "Non-Technical", date: "Jul 29", time: "2:00 PM", venue: "Placement Hall", description: "Portfolio reviews and recruiter-style feedback for internship applicants.", rules: "Upload resume link before registration closes.", schedule: "Talk | Review tables | Peer edit session", entryFee: 120, createdBy: "coord-1", capacity: 65 }
  ],
  registrations: [
    { id: "reg-1", eventId: "event-2", studentId: "stu-1", studentName: "Aarav Mehta", studentEmail: "student@campus.edu", status: "Approved", paymentMethod: "Free", paymentStatus: "Paid", transactionId: "FREE-7721", teamName: "Solo", docs: "portfolio.example/aarav" },
    { id: "reg-2", eventId: "event-1", studentId: "stu-1", studentName: "Aarav Mehta", studentEmail: "student@campus.edu", status: "Pending", paymentMethod: "UPI", paymentStatus: "Paid", transactionId: "TXN-853112", teamName: "Prompt Pilots", docs: "drive.example/prototype" }
  ],
  attendance: [],
  notifications: [
    { id: "note-1", userId: "stu-1", title: "TechnoCraft Cultural Stage approved", message: "Your pass is ready for the venue gate.", timestamp: "Today", isRead: false },
    { id: "note-2", userId: "stu-1", title: "TechnoCraft Hack Sprint pending", message: "Coordinator review is in progress.", timestamp: "Yesterday", isRead: true }
  ]
};

let state = loadState();
let splashTimer = null;

function loadState() {
  const saved = localStorage.getItem("technocraft-state");
  if (!saved) return structuredClone(seed);
  const parsed = JSON.parse(saved);
  delete parsed.currentUser;
  return { ...structuredClone(seed), ...parsed, currentUser: null, showSplash: true };
}

function saveState() {
  const persisted = { ...state, currentUser: null };
  localStorage.setItem("technocraft-state", JSON.stringify(persisted));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function applyDarkMode() {
  document.documentElement.classList.toggle("dark", Boolean(state.darkMode));
}

function showToast(message, type = "info") {
  const existing = document.getElementById("tc-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "tc-toast";
  toast.className = `tc-toast tc-toast-${type}`;
  const icons = { success: "check_circle", error: "error", info: "info", warning: "warning" };
  toast.innerHTML = `<span class="material-symbols-rounded" style="font-size:20px;opacity:1;">${icons[type] || "info"}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 400); }, 3200);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function daysUntil(dateStr) {
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const parts = dateStr.trim().split(" ");
  if (parts.length < 2) return null;
  const d = new Date(2026, months[parts[0]], parseInt(parts[1]));
  const diff = Math.ceil((d - new Date()) / 86400000);
  return diff;
}

function animateMetrics() {
  document.querySelectorAll(".metric[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const val = el.querySelector(".metric-val");
    if (!val || isNaN(target)) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      val.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

async function syncCollection(collection, item) {
  if (!window.TechnoCraftCloud?.enabled()) return;
  try {
    await window.TechnoCraftCloud.upsert(collection, item.id, item);
    state.cloudStatus = "Firebase synced";
    saveState();
  } catch (error) {
    state.cloudStatus = `Firebase sync failed: ${error.message}`;
    saveState();
  }
}

function money(value) {
  return `Rs ${Number(value).toFixed(2)}`;
}

function byId(id) {
  return document.getElementById(id);
}

function selectedEvent() {
  return state.events.find((event) => event.id === state.selectedEventId) || state.events[0];
}

function userRegistrations(userId = state.currentUser?.id) {
  return state.registrations.filter((reg) => reg.studentId === userId);
}

function eventName(eventId) {
  return state.events.find((event) => event.id === eventId)?.name || "Unknown event";
}

function eventRegistrations(eventId) {
  return state.registrations.filter((reg) => reg.eventId === eventId);
}

function normalizeIdentity(role, rawIdentity = "") {
  const value = rawIdentity.trim().toLowerCase();
  if (!value) return { email: `${role.toLowerCase()}@campus.edu`, studentId: "" };
  if (value.includes("@")) return { email: value, studentId: "" };
  const domain = role === "Student" ? "students.technocraft.local" : "technocraft.local";
  return { email: `${value.replace(/[^a-z0-9._-]/g, "-")}@${domain}`, studentId: value.toUpperCase() };
}

function firebaseEnabled() {
  return Boolean(window.TechnoCraftCloud?.enabled());
}

function firstTab(role) {
  return navFor(role)[0].label;
}

function msIcon(name, extraClass = "") {
  return `<span class="material-symbols-rounded app-icon ${extraClass}" aria-hidden="true">${name}</span>`;
}

function createUserProfile(role, email, name = "", studentId = "") {
  const safeRole = role.toLowerCase();
  return {
    id: `${safeRole}-${Date.now()}`,
    email: email || `${safeRole}-${Date.now()}@campus.edu`,
    name: name || `New ${role}`,
    role,
    rollNo: byId("rollNo")?.value || studentId || (role === "Student" ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : ""),
    branch: byId("branch")?.value || (role === "Student" ? "General" : ""),
    year: byId("year")?.value || (role === "Student" ? "1" : ""),
    department: byId("department")?.value || (role !== "Student" ? "Student Affairs" : ""),
    coordinatingCategory: byId("category")?.value || (role === "Coordinator" ? "Technical" : "")
  };
}

function mergeUser(user) {
  const index = state.users.findIndex((item) => item.id === user.id || item.email === user.email);
  if (index >= 0) {
    state.users[index] = { ...state.users[index], ...user };
    return;
  }
  state.users.push(user);
}

async function login(role) {
  const identity = byId("email")?.value.trim();
  const password = byId("password")?.value.trim();
  const name = byId("name")?.value?.trim();

  if (!identity || !password) {
    return showToast("Please enter your email and password.", "warning");
  }

  const { email } = normalizeIdentity(role, identity);

  // ---- SIGN IN FLOW ----
  if (state.authMode === "login") {
    if (!firebaseEnabled()) {
      // Offline demo mode fallback
      const { studentId } = normalizeIdentity(role, identity);
      const found = state.users.find((u) => u.role === role && (!email || u.email === email || u.rollNo?.toLowerCase() === identity?.toLowerCase()));
      const user = found || createUserProfile(role, email, `${role} User`, studentId);
      mergeUser(user);
      setState({ currentUser: user, activeTab: firstTab(role), cloudStatus: "Local demo mode" });
      return showToast("Logged in (Offline Mode)", "info");
    }
    try {
      const result = await window.TechnoCraftCloud.signIn(email, password);
      const verifiedRole = result.verifiedRole;

      if (verifiedRole === "pending_coordinator") {
        return showToast("Your Coordinator account is awaiting Admin approval.", "warning");
      }

      const user = result.user;
      mergeUser(user);
      setState({ currentUser: user, activeTab: firstTab(verifiedRole), cloudStatus: "Firebase authenticated" });
      showToast(`Welcome back, ${user.name?.split(" ")[0] || "User"}!`, "success");
    } catch (error) {
      setState({ currentUser: null, cloudStatus: `Login failed: ${error.message}` });
      showToast(`Login failed: ${error.message.replace("Firebase: ", "").replace("auth/", "")}`, "error");
    }
    return;
  }

  // ---- REGISTER FLOW ----
  if (!name) return showToast("Please enter your full name.", "warning");

  if (role === "Admin") {
    return showToast("Admin accounts cannot be registered from the app.", "error");
  }

  if (!firebaseEnabled()) {
    // Offline demo mode fallback
    const { studentId } = normalizeIdentity(role, identity);
    const user = createUserProfile(role === "Student" ? "Student" : "Coordinator", email, name, studentId);
    mergeUser(user);
    setState({ currentUser: role === "Student" ? user : null, activeTab: firstTab(role), cloudStatus: "Local demo mode" });
    return showToast(role === "Student" ? "Account created (Offline Mode)" : "Coordinator request submitted (Offline Mode)", "info");
  }

  try {
    if (role === "Coordinator") {
      const { studentId } = normalizeIdentity(role, identity);
      const profile = createUserProfile("Coordinator", email, name, studentId);
      const result = await window.TechnoCraftCloud.requestCoordinatorAccount(email, password, profile);
      showToast(result.message || "Coordinator request submitted. Awaiting Admin approval.", "info");
    } else {
      const { studentId } = normalizeIdentity(role, identity);
      const profile = createUserProfile("Student", email, name, studentId);
      const result = await window.TechnoCraftCloud.registerStudent(email, password, profile);
      const user = result.user;
      mergeUser(user);
      setState({ currentUser: user, activeTab: firstTab("Student"), cloudStatus: "Firebase account created" });
      showToast("Account created successfully!", "success");
    }
  } catch (error) {
    setState({ currentUser: null, cloudStatus: `Registration failed: ${error.message}` });
    showToast(`Error: ${error.message.replace("Firebase: ", "").replace("auth/", "")}`, "error");
  }
}

async function logout() {
  try {
    await window.TechnoCraftCloud?.signOut?.();
  } catch (error) {
    state.cloudStatus = `Sign out warning: ${error.message}`;
  }
  setState({ currentUser: null, authStep: "role", activeTab: "Home", scanResult: "", selectedEventId: "event-1", eventScreenMode: "list", cloudStatus: "Signed out", sidebarCollapsed: false, notifDrawerOpen: false });
}

function navFor(role) {
  if (role === "Student") {
    return [
      { label: "Home", icon: "home" },
      { label: "Events", icon: "event" },
      { label: "QR Pass", icon: "qr_code_scanner" },
      { label: "Profile", icon: "account_circle" }
    ];
  }
  if (role === "Coordinator") {
    return [
      { label: "Home", icon: "home" },
      { label: "Create", icon: "add_circle" },
      { label: "Registrations", icon: "task_alt" },
      { label: "Scanner", icon: "qr_code_scanner" },
      { label: "Reports", icon: "bar_chart" }
    ];
  }
  return [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Students", icon: "school" },
    { label: "Coords", icon: "badge" },
    { label: "Events", icon: "event" },
    { label: "Reports", icon: "analytics" }
  ];
}

function render() {
  const app = byId("app");
  applyDarkMode();
  if (state.currentUser) {
    const allowedTabs = navFor(state.currentUser.role).map((nav) => nav.label);
    if (!allowedTabs.includes(state.activeTab)) {
      state.activeTab = allowedTabs[0];
      saveState();
    }
  }
  if (state.showSplash) {
    app.innerHTML = renderSplash();
    if (!splashTimer) {
      splashTimer = window.setTimeout(() => {
        splashTimer = null;
        setState({ showSplash: false });
      }, 2800);
    }
    bindEvents();
    return;
  }
  app.innerHTML = (state.currentUser ? renderShell() : renderAuth()) + renderUpiModal();
  bindEvents();
  if (state.currentUser) {
    animateMetrics();
  }
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Fast, crisp digital arpeggio (resolving by 2.5s)
    const notes = [
      { freq: 523.25, type: "sine",     start: 0.0,  dur: 0.4, vol: 0.15 }, // C5
      { freq: 659.25, type: "sine",     start: 0.15, dur: 0.4, vol: 0.15 }, // E5
      { freq: 783.99, type: "sine",     start: 0.3,  dur: 0.5, vol: 0.15 }, // G5
      { freq: 1046.50,type: "sine",     start: 0.45, dur: 1.8, vol: 0.18 }, // C6 (long resolve chime)
      { freq: 1318.51,type: "triangle", start: 0.6,  dur: 1.5, vol: 0.05 }  // E6 (shimmer overlay)
    ];

    notes.forEach(({ freq, type, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      
      // Smooth attack/decay volume envelopes to avoid pops
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur - 0.02);
      
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  } catch (_) {}
}

function renderSplash() {
  setTimeout(playChime, 250);
  return `
    <main class="splash-screen brand-splash" role="status" aria-label="TechnoCraft loading">
      <div class="splash-cinematic">
        <!-- Eclipse backlight flare -->
        <div class="splash-eclipse-flare"></div>

        <!-- Centered official full logo lockup -->
        <div class="splash-logo-container">
          <img class="splash-official-logo" src="./images/technocraft_full_logo.png" alt="TechnoCraft" />
        </div>

        <!-- Tagline -->
        <p class="splash-tagline">Campus Event Portal · 2026</p>
      </div>
    </main>
  `;
}

function renderAuth() {
  const role = state.authRole;
  const showStatus = state.cloudStatus
    && !["Local demo mode", "Signed out", "Firebase connected", "Firebase authenticated"].includes(state.cloudStatus);
  return `
    <main class="auth-shell-new" aria-label="TechnoCraft login">
      <div class="auth-bg-pattern" aria-hidden="true"></div>
      <div class="auth-center-wrap">
        <div class="auth-card">

          <!-- Branding Section -->
          <div class="auth-brand-section">
            <img
              class="auth-helmet-logo"
              src="./images/technocraft_helmet.png"
              alt="TechnoCraft gold Roman helmet logo"
              onerror="this.style.display='none'; document.getElementById('auth-helmet-fallback').style.display='flex';"
            />
            <div id="auth-helmet-fallback" class="auth-helmet-fallback" style="display:none;" aria-hidden="true">
              <span class="material-symbols-rounded" style="font-size:64px;color:#c49a22;">shield</span>
            </div>
            <img
              class="auth-wordmark-logo"
              src="./images/technocraft_full_logo.png"
              alt="TECHNOCRAFT"
              onerror="this.style.display='none'; document.getElementById('auth-wordmark-fallback').style.display='block';"
            />
            <div id="auth-wordmark-fallback" style="display:none;">
              <p class="auth-wordmark-text">TECHNOCRAFT</p>
            </div>
            <div class="auth-year-row" aria-label="2026 Campus Event Portal">
              <span class="auth-gold-line" aria-hidden="true"></span>
              <span class="auth-year-label">2026</span>
              <span class="auth-gold-line" aria-hidden="true"></span>
            </div>
            <p class="auth-subtitle">Campus Event Portal</p>
          </div>

          <!-- Status Message -->
          ${showStatus ? `<div class="auth-status-new" role="alert">${state.cloudStatus}</div>` : ""}

          <!-- Role Tabs -->
          <div class="role-tab-bar" role="tablist" aria-label="Select your role">
            ${["Student", "Coordinator", "Admin"].map((item) => `
              <button
                class="role-tab ${role === item ? "active" : ""}"
                data-role="${item}"
                role="tab"
                aria-selected="${role === item ? "true" : "false"}"
                id="role-tab-${item.toLowerCase()}"
              >
                ${msIcon(roleIcon(item), "role-tab-icon")}
                <span>${item}</span>
              </button>
            `).join("")}
          </div>

          <!-- Form -->
          <div class="auth-form-section">
            <p class="auth-form-heading">
              ${state.authMode === "login" ? "Sign in to your account" : (role === "Student" ? "Create student account" : "Request coordinator access")}
            </p>

            <div class="auth-field">
              <label for="email" class="auth-label">Email / Student ID</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon material-symbols-rounded" aria-hidden="true">person</span>
                <input
                  id="email"
                  type="text"
                  class="auth-input"
                  value=""
                  autocomplete="username"
                  placeholder="E.g., ${role.toLowerCase()}@campus.edu"
                />
              </div>
            </div>

            <div class="auth-field">
              <label for="password" class="auth-label">Password</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon material-symbols-rounded" aria-hidden="true">lock</span>
                <input
                  id="password"
                  type="password"
                  class="auth-input auth-input-password"
                  value=""
                  autocomplete="current-password"
                  placeholder="Enter password"
                />
                <button
                  class="auth-toggle-pw"
                  id="togglePw"
                  type="button"
                  aria-label="Toggle password visibility"
                  title="Show / hide password"
                >
                  ${msIcon("visibility", "auth-pw-icon")}
                </button>
              </div>
            </div>

            ${state.authMode === "register" ? `<div class="auth-register-fields">${registerFields(role)}</div>` : ""}

            <button class="auth-continue-btn" id="loginBtn" type="button">
              ${state.authMode === "login" ? `Continue as ${role}` : (role === "Student" ? "Register as Student" : "Submit Access Request")}
              ${msIcon("arrow_forward", "auth-btn-icon")}
            </button>

            <div class="auth-foot-row">
              ${role !== "Admin" ? `
                <button class="auth-text-link" id="toggleAuth" type="button">
                  ${state.authMode === "login" ? (role === "Student" ? "Create student account" : "Request access") : "Back to sign in"}
                </button>
              ` : `<span></span>`}
              <button class="auth-text-link auth-forgot-pw-link" type="button">Forgot password?</button>
            </div>
          </div>

        </div>

        <!-- Horizontal scroll carousel for upcoming events -->
        <div class="auth-carousel-container" aria-label="Upcoming TechnoCraft events">
          <p class="auth-carousel-title">Upcoming Events</p>
          <div class="auth-carousel-track">
            <div class="auth-teaser"><span class="teaser-cat">Technical</span><strong>Hack Sprint</strong><em>Jul 18</em></div>
            <div class="auth-teaser"><span class="teaser-cat">Cultural</span><strong>Stage Night</strong><em>Jul 22</em></div>
            <div class="auth-teaser"><span class="teaser-cat">Sports</span><strong>Robo Race</strong><em>Jul 25</em></div>
            <div class="auth-teaser"><span class="teaser-cat">Non-Tech</span><strong>Career Lab</strong><em>Jul 29</em></div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderLogo(extraClass = "") {
  return `
    <img class="tc-full-logo ${extraClass}" src="./images/technocraft_full_logo.png" alt="TechnoCraft"
      onerror="this.style.opacity='0';"
    />
  `;
}

function renderBrandLockup(extraClass = "") {
  return `
    <div class="brand-lockup ${extraClass}">
      ${renderLogo()}
    </div>
  `;
}

function roleCopy(role) {
  if (role === "Student") return "Browse events, register, and unlock passes.";
  if (role === "Coordinator") return "Publish events, approve entries, and scan.";
  return "Monitor users, catalogs, finance, and reports.";
}

function roleIcon(role) {
  if (role === "Student") return "school";
  if (role === "Coordinator") return "engineering";
  return "admin_panel_settings";
}

function registerFields(role) {
  if (role === "Student") {
    return `
      <div class="field"><label for="name">Name</label><input id="name" value="New Student" /></div>
      <div class="field"><label for="rollNo">Roll number</label><input id="rollNo" value="CSE-301" /></div>
      <div class="field"><label for="branch">Branch</label><input id="branch" value="Computer Science" /></div>
      <div class="field"><label for="year">Year</label><input id="year" value="3" /></div>
    `;
  }
  if (role === "Coordinator") {
    return `
      <div class="field"><label for="name">Name</label><input id="name" value="New Coordinator" /></div>
      <div class="field"><label for="department">Department</label><input id="department" value="Computer Science" /></div>
      <div class="field full"><label for="category">Category authority</label><select id="category"><option>Technical</option><option>Non-Technical</option><option>Cultural</option><option>Sports</option></select></div>
    `;
  }
  return `<div class="field full"><label for="name">Name</label><input id="name" value="New Administrator" /></div>`;
}

function renderShell() {
  const user = state.currentUser;
  const navItems = navFor(user.role);
  const collapsed = state.sidebarCollapsed;
  const menuOpen = state.mobileMenuOpen;
  return `
    <div class="app-shell ${collapsed ? "sidebar-collapsed" : ""}">
      <aside class="sidebar">
        <div class="sidebar-head">
          ${collapsed ? `
            <div class="sidebar-avatar-only">${initials(user.name)}</div>
          ` : renderBrandLockup("sidebar-brand")}
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="${collapsed ? "Expand" : "Collapse"} sidebar" aria-label="Toggle sidebar">
            ${msIcon(collapsed ? "chevron_right" : "chevron_left")}
          </button>
        </div>
        <nav class="nav-list">
          ${navItems.map((nav) => `
            <button class="nav-item ${state.activeTab === nav.label ? "active" : ""}" data-tab="${nav.label}" title="${nav.label}">
              ${msIcon(nav.icon, "nav-icon")}
              ${collapsed ? "" : `<span class="nav-label">${nav.label}</span>`}
            </button>
          `).join("")}
        </nav>
        <div class="sidebar-bottom">
          <button class="dark-toggle-btn" id="darkToggleBtn" title="Toggle dark mode" aria-label="Toggle dark mode">
            ${msIcon(state.darkMode ? "light_mode" : "dark_mode", "small-icon")}
            ${collapsed ? "" : `<span>${state.darkMode ? "Light mode" : "Dark mode"}</span>`}
          </button>
          ${collapsed ? `
            <button class="secondary" id="logoutBtn" title="Sign out" style="min-height:42px;padding:0;width:42px;">${msIcon("logout", "small-icon")}</button>
          ` : `
            <div class="user-card">
              <div class="user-avatar-row">
                <div class="user-avatar" aria-label="${user.name}">${initials(user.name)}</div>
                <div class="user-info">
                  <strong>${user.name}</strong>
                  <span>${user.email}</span>
                </div>
              </div>
              <button class="secondary" id="logoutBtn" style="width:100%; margin-top:12px;">${msIcon("logout", "small-icon")}Sign out</button>
            </div>
          `}
        </div>
      </aside>
      <main class="main main-animated">
        ${renderMain(user)}
      </main>
    </div>
    <!-- Mobile Burger Menu Drawer -->
    <div class="burger-backdrop ${menuOpen ? "open" : ""}" id="burgerBackdrop"></div>
    <nav class="burger-drawer ${menuOpen ? "open" : ""}" id="burgerDrawer" aria-label="Mobile navigation">
      <div class="burger-drawer-head">
        ${renderBrandLockup("burger-brand")}
        <button class="icon-btn" id="closeBurger" aria-label="Close menu">${msIcon("close")}</button>
      </div>
      <div class="burger-nav-list">
        ${navItems.map((nav) => `
          <button class="burger-nav-item ${state.activeTab === nav.label ? "active" : ""}" data-tab="${nav.label}" id="burger-tab-${nav.label.toLowerCase().replace(" ","-")}">
            ${msIcon(nav.icon, "burger-nav-icon")}
            <span>${nav.label}</span>
          </button>
        `).join("")}
      </div>
      <div class="burger-footer">
        <div class="user-avatar-row" style="padding:0 20px 8px;">
          <div class="user-avatar">${initials(user.name)}</div>
          <div class="user-info">
            <strong style="font-size:0.88rem;">${user.name}</strong>
            <span style="font-size:0.76rem;color:var(--muted);">${user.email}</span>
          </div>
        </div>
        <button class="dark-toggle-btn" id="darkToggleBtnBurger" style="margin:0 12px 8px;width:calc(100% - 24px);">
          ${msIcon(state.darkMode ? "light_mode" : "dark_mode", "small-icon")}
          <span>${state.darkMode ? "Light mode" : "Dark mode"}</span>
        </button>
        <button class="secondary" id="logoutBtnBurger" style="margin:0 12px 12px;width:calc(100% - 24px);">${msIcon("logout", "small-icon")}Sign out</button>
      </div>
    </nav>
    <!-- Mobile top bar -->
    <header class="mobile-topbar" id="mobileTopbar">
      <button class="burger-btn" id="burgerMenuBtn" aria-label="Open menu" title="Open navigation menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>
      <img class="mobile-topbar-logo" src="./images/technocraft_helmet.png" alt="TechnoCraft" />
      <div class="mobile-topbar-right">
        ${user.role === "Student" ? `
          <button class="icon-btn notif-btn" id="mobileNotifBtn" aria-label="Notifications" style="position:relative;">
            ${msIcon("notifications")}
            ${state.notifications.filter((n) => n.userId === user.id && !n.isRead).length ? `<span class="notif-badge">${state.notifications.filter((n) => n.userId === user.id && !n.isRead).length}</span>` : ""}
          </button>
        ` : ""}
        <div class="user-avatar" style="width:32px;height:32px;font-size:0.72rem;">${initials(user.name)}</div>
      </div>
    </header>
    <!-- Quick Register FAB (Student only) -->
    ${user.role === "Student" ? `
      <button class="fab" id="fabRegister" title="Quick register" aria-label="Quick register for next event">
        ${msIcon("add", "fab-icon")}
      </button>
    ` : ""}
  `;
}

function renderMain(user) {
  if (user.role === "Student") return renderStudent();
  if (user.role === "Coordinator") return renderCoordinator();
  return renderAdmin();
}

function renderHeader(title, subtitle) {
  const unread = state.notifications.filter((n) => n.userId === state.currentUser?.id && !n.isRead).length;
  return `
    <header class="topbar">
      <div class="page-title">
        <p class="eyebrow">${state.currentUser.role}</p>
        <h2>${title}</h2>
        ${subtitle ? `<p class="subtle">${subtitle}</p>` : ""}
      </div>
      <div class="top-actions">
        <button class="icon-btn" id="darkToggleBtn" title="Toggle dark mode" aria-label="Toggle dark mode">
          ${msIcon(state.darkMode ? "light_mode" : "dark_mode")}
        </button>
        ${state.currentUser.role === "Student" ? `
          <button class="icon-btn notif-btn" id="notifDrawerBtn" title="Notifications" aria-label="Notifications">
            ${msIcon("notifications")}
            ${unread ? `<span class="notif-badge">${unread}</span>` : ""}
          </button>
        ` : ""}
        <button class="profile-pill openProfile">
          <span class="user-avatar-sm">${initials(state.currentUser.name)}</span>
          <strong>${state.currentUser.name}</strong>
        </button>
      </div>
    </header>
    <!-- Notification drawer -->
    <div class="notif-drawer ${state.notifDrawerOpen ? "open" : ""}" id="notifDrawer">
      <div class="notif-drawer-head">
        <strong>Notifications</strong>
        <div style="display:flex;gap:8px;">
          <button class="secondary notif-mark-all" id="markAllRead" style="min-height:32px;font-size:0.76rem;padding:0 10px;">Mark all read</button>
          <button class="icon-btn" id="closeNotifDrawer" style="min-height:32px;">${msIcon("close")}</button>
        </div>
      </div>
      <div class="notif-drawer-body">
        ${state.notifications.filter((n) => n.userId === state.currentUser?.id).reverse().map((n) => `
          <div class="notif-item ${n.isRead ? "" : "notif-unread"}">
            <div class="notif-dot"></div>
            <div class="notif-content">
              <p>${n.title}</p>
              <span>${n.message}</span>
              <small>${n.timestamp}</small>
            </div>
          </div>
        `).join("") || `<div class="empty-state" style="padding:30px 0;">${msIcon("notifications_off", "empty-icon")}<p>No notifications</p></div>`}
      </div>
    </div>
    <div class="notif-backdrop ${state.notifDrawerOpen ? "open" : ""}" id="notifBackdrop"></div>
  `;
}

function renderStudent() {
  const tab = state.activeTab;
  const approved = userRegistrations().filter((reg) => reg.status === "Approved").length;
  const pending = userRegistrations().filter((reg) => reg.status === "Pending").length;
  const total = state.events.length;
  const joined = userRegistrations().length;
  const pct = total ? Math.round((joined / total) * 100) : 0;
  const certs = state.attendance.filter((row) => row.studentId === state.currentUser.id).length;
  if (tab === "Events") return `${renderHeader(state.eventScreenMode === "details" ? "Event details" : "Events", state.eventScreenMode === "details" ? "Review event information before registration." : "Search, filter, and register for TechnoCraft events.")}${renderStudentEventView()}`;
  if (tab === "QR Pass") return `${renderHeader("QR pass", "Approved registrations become venue-ready QR passes.")}${renderPasses()}`;
  if (tab === "Profile") return `${renderHeader("Profile", "Your account, notifications, and certificate status.")}${renderProfile()}`;
  // Next event countdown
  const nextEvent = state.events.find((ev) => (daysUntil(ev.date) || 0) >= 0);
  const nextDays = nextEvent ? daysUntil(nextEvent.date) : null;
  return `
    ${renderHeader("Home", "")}
    <!-- Greeting banner -->
    <div class="greeting-banner">
      <div class="greeting-text">
        <span class="greeting-emoji">👋</span>
        <div>
          <h3>${getGreeting()}, ${state.currentUser.name.split(" ")[0]}!</h3>
          <p>${approved} approved ${approved === 1 ? "pass" : "passes"} &bull; ${pending} pending &bull; ${certs} certificate${certs !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div class="progress-tracker">
        <span>${joined} of ${total} events joined</span>
        <div class="progress-line" style="margin:6px 0 0;"><span style="width:${pct}%; transition:width 0.8s ease;"></span></div>
      </div>
    </div>
    ${nextEvent ? `
      <div class="next-event-strip">
        ${msIcon("event", "next-event-icon")}
        <div>
          <span class="next-event-label">NEXT EVENT</span>
          <strong>${nextEvent.name}</strong>
        </div>
        <span class="next-event-countdown">${nextDays === 0 ? "Today! 🔥" : `in ${nextDays} day${nextDays !== 1 ? "s" : ""}`}</span>
        <button class="secondary next-event-btn viewDetails" data-event="${nextEvent.id}">View</button>
      </div>
    ` : ""}
    <section class="stats-grid">
      ${metric("Events", state.events.length, "event")}
      ${metric("Passes", approved, "qr_code_scanner")}
      ${metric("Pending", pending, "hourglass_empty")}
      ${metric("Certs", certs, "workspace_premium")}
    </section>
    ${renderFeaturedEvent()}
    <section class="content-grid">
      <div>
        ${renderEventCatalog(true)}
        ${renderMyRegistrations()}
      </div>
      <aside>${renderRegistrationPanel()}</aside>
    </section>
  `;
}

function renderFeaturedEvent() {
  const event = selectedEvent();
  const count = eventRegistrations(event.id).length;
  return `
    <section class="feature-band">
      <div>
        <span class="tag">${event.category}</span>
        <h3>${event.name}</h3>
        <p>${event.description}</p>
        <div class="hero-metrics">
          <div><strong>${event.date}</strong><span>Date</span></div>
          <div><strong>${event.capacity - count}</strong><span>Seats left</span></div>
          <div><strong>${event.entryFee ? money(event.entryFee) : "Free"}</strong><span>Entry</span></div>
        </div>
      </div>
      <div class="feature-actions">
        <span>${event.time} | ${event.venue}</span>
        <button class="primary selectEvent" data-event="${event.id}">Open details</button>
      </div>
    </section>
  `;
}

function renderStudentEventView() {
  if (state.eventScreenMode === "details") {
    return `
      <button class="secondary backToEvents" style="margin-bottom:16px;">Back to events</button>
      <section class="content-grid">
        <div>${renderEventDetails()}</div>
        <aside>${renderRegistrationPanel()}</aside>
      </section>
    `;
  }
  return `
    ${renderEventCatalog(false)}
  `;
}

function renderEventCatalog(limit = false) {
  const query = state.eventSearch.trim().toLowerCase();
  let filtered = state.events.filter((event) => {
    const matchesCategory = state.eventCategoryFilter === "All" || event.category === state.eventCategoryFilter;
    const matchesSearch = !query || `${event.name} ${event.category} ${event.venue}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  // Sort
  if (state.eventSortBy === "fee") filtered = [...filtered].sort((a, b) => a.entryFee - b.entryFee);
  else if (state.eventSortBy === "popular") filtered = [...filtered].sort((a, b) => eventRegistrations(b.id).length - eventRegistrations(a.id).length);
  const events = limit ? filtered.slice(0, 4) : filtered;
  const cats = ["All", "Technical", "Non-Technical", "Cultural", "Sports"];
  
  let gridContent = "";
  if (state.isLoading) {
    gridContent = Array(limit ? 4 : 6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:80%"></div>
        <div class="skeleton skeleton-text" style="width:40%; margin-top:16px;"></div>
      </div>
    `).join("");
  } else if (events.length === 0) {
    gridContent = `
      <div class="empty-state">
        ${msIcon("event_busy", "app-icon")}
        <h3>No events found</h3>
        <p>There are currently no events matching your criteria. Check back later or try clearing your filters.</p>
      </div>
    `;
  } else {
    gridContent = events.map(renderEventCard).join("");
  }

  return `
    <section class="section">
      <div class="section-head">
        <h3>Upcoming events</h3>
        <div class="catalog-controls">
          <div class="search-wrap">
            ${msIcon("search", "search-icon")}
            <input id="eventSearch" type="search" value="${state.eventSearch}" placeholder="Search events..." />
          </div>
          <select class="sort-select" id="eventSort">
            <option value="date" ${state.eventSortBy === "date" ? "selected" : ""}>Sort: Date</option>
            <option value="fee" ${state.eventSortBy === "fee" ? "selected" : ""}>Sort: Fee</option>
            <option value="popular" ${state.eventSortBy === "popular" ? "selected" : ""}>Sort: Popular</option>
          </select>
          <div class="view-toggle">
            <button class="view-btn ${state.eventViewMode === "grid" ? "active" : ""}" data-view="grid" title="Grid view">${msIcon("grid_view")}</button>
            <button class="view-btn ${state.eventViewMode === "list" ? "active" : ""}" data-view="list" title="List view">${msIcon("view_list")}</button>
          </div>
        </div>
      </div>
      <!-- Category chip strip -->
      <div class="cat-chip-strip">
        ${cats.map((cat) => `
          <button class="cat-chip categoryFilter ${state.eventCategoryFilter === cat ? "active" : ""}" data-category="${cat}">
            ${cat === "Technical" ? msIcon("engineering", "chip-icon") : cat === "Cultural" ? msIcon("music_note", "chip-icon") : cat === "Sports" ? msIcon("sports", "chip-icon") : cat === "Non-Technical" ? msIcon("description", "chip-icon") : msIcon("grid_view", "chip-icon")}
            ${cat}
          </button>
        `).join("")}
      </div>
      <div class="event-grid ${state.eventViewMode === 'list' ? 'event-list-view' : ''}">
        ${gridContent}
      </div>
    </section>
  `;
}

function renderEventCard(event) {
  const count = eventRegistrations(event.id).length;
  const selected = state.selectedEventId === event.id;
  const existing = state.currentUser.role === "Student" ? userRegistrations().find((reg) => reg.eventId === event.id) : null;
  const fee = Number(event.entryFee);
  const seatsLeft = Math.max(0, event.capacity - count);
  const soldOut = seatsLeft === 0;
  const fillPct = Math.min(100, Math.round((count / event.capacity) * 100));
  const days = daysUntil(event.date);
  const countdownTxt = days === null ? "" : days < 0 ? "Ended" : days === 0 ? "Today!" : `In ${days}d`;
  const countdownCls = days !== null && days < 0 ? "past" : days === 0 ? "today" : "";
  const catColor = { Technical: "#0f7b63", Cultural: "#7b39b0", Sports: "#bf6020", "Non-Technical": "#255a96" }[event.category] || "#0f7b63";
  return `
    <article class="event-card bento-card ${selected ? "selected-card" : ""} ${soldOut ? "sold-out-card" : ""} ${existing ? "registered-card" : ""}">
      <div class="bento-accent" style="background:${catColor}"></div>
      <div class="bento-body">
        <div class="bento-top">
          <div class="bento-cat-dot-row">
            <span class="bento-cat-dot" style="background:${catColor}"></span>
            <span class="bento-cat-label">${event.category.toUpperCase()}</span>
            ${existing ? `<span class="bento-registered-badge">${msIcon("verified", "bento-check-icon")} Registered</span>` : ""}
          </div>
          ${countdownTxt ? `<span class="bento-countdown ${countdownCls}">${countdownTxt}</span>` : ""}
        </div>
        <h4 class="bento-title">${event.name}</h4>
        <p class="bento-meta">${event.date} · ${event.time} · ${event.venue}</p>
        <div class="bento-bottom">
          <div class="bento-left">
            <div class="bento-seat-bar">
              <div class="bento-seat-fill" style="width:${fillPct}%;background:${soldOut ? "#c0392b" : fillPct > 70 ? "#e67e22" : catColor}"></div>
            </div>
            <span class="bento-price">${fee ? money(fee) : "FREE"}</span>
          </div>
          <div class="bento-actions">
            <button class="bento-details-btn viewDetails" data-event="${event.id}">${msIcon("info")}</button>
            ${state.currentUser.role === "Student" ?
              existing ? `<button class="bento-reg-btn bento-reg-done" disabled>${msIcon("check")}</button>` :
              soldOut ? `<button class="bento-reg-btn" disabled>${msIcon("block")}</button>` :
              `<button class="bento-reg-btn bento-reg-go quickRegister" data-event="${event.id}">${msIcon("add")}</button>` : ""}
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderEventDetails() {
  const event = selectedEvent();
  const count = eventRegistrations(event.id).length;
  const total = Number(event.entryFee) * 1.15;
  return `
    <section class="form-panel event-details-panel">
      <div class="detail-cover cat-${event.category.toLowerCase()}">
        <span>${event.category}</span>
        <strong>${event.date}</strong>
      </div>
      <h3>${event.name}</h3>
      <div class="tag-row">
        <span class="tag blue">${event.date}, 2026 | ${event.time}</span>
        <span class="tag light">${event.venue}</span>
        <span class="tag gold">${money(total)}</span>
      </div>
      <p class="small-meta">${event.description}</p>
      <div class="data-table profile-stats">
        <div><span>Available seats</span><strong>${Math.max(0, event.capacity - count)}</strong></div>
        <div><span>Team size</span><strong>1-4</strong></div>
        <div><span>Coordinator</span><strong>Nisha Rao</strong></div>
        <div><span>Documents</span><strong>Required</strong></div>
      </div>
      <h3 style="margin-top:20px;">Rules</h3>
      <p class="small-meta">${event.rules}</p>
      <h3 style="margin-top:20px;">Schedule</h3>
      <div class="timeline">${event.schedule.split("|").map((item) => `<div><span></span>${item.trim()}</div>`).join("")}</div>
    </section>
  `;
}

function categorySymbol(category) {
  if (category === "Technical") return msIcon("engineering", "event-icon");
  if (category === "Cultural") return msIcon("present_to_all", "event-icon");
  if (category === "Sports") return msIcon("sports_score", "event-icon");
  if (category === "Non-Technical") return msIcon("description", "event-icon");
  return msIcon("event", "event-icon");
}

function renderRegistrationPanel() {
  const event = selectedEvent();
  const fee = Number(event.entryFee);
  const gateway = fee * 0.15;
  const total = fee + gateway;
  const existing = userRegistrations().find((reg) => reg.eventId === event.id);
  return `
    <section class="form-panel checkout-panel">
      <div class="detail-cover cat-${event.category.toLowerCase()}">
        <span>${event.category}</span>
        <strong>${event.date}</strong>
      </div>
      <p class="eyebrow">Event details</p>
      <h3>${event.name}</h3>
      <p class="small-meta">${event.rules}</p>
      <div class="tag-row">
        <span class="tag light">${event.date}</span>
        <span class="tag blue">${event.venue}</span>
        <span class="tag gold">${fee ? money(total) : "Free entry"}</span>
      </div>
      <div class="timeline">
        ${event.schedule.split("|").map((item) => `<div><span></span>${item.trim()}</div>`).join("")}
      </div>
      ${existing ? `<p class="scan-result">Registration status: ${existing.status}</p>` : `
        <div class="checkout-step"><strong>1</strong><span>Participant details</span></div>
        <div class="field" style="margin-top:14px;">
          <label for="teamName">Team name</label>
          <input id="teamName" value="Solo" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label for="docs">Document link</label>
          <input id="docs" value="drive.example/submission" />
        </div>
        <div class="checkout-step"><strong>2</strong><span>${fee ? "Payment method" : "Confirmation"}</span></div>
        <div class="field" style="margin-top:12px;">
          <label for="paymentMethod">Payment method</label>
          <select id="paymentMethod">
            <option value="UPI">UPI / QR Code</option>
            <option value="KnitPayUPI">Knit Pay UPI (RapidAPI)</option>
            <option value="Razorpay">Razorpay (Card/Net Banking)</option>
          </select>
        </div>
        <div class="payment-box">
          <strong>${fee ? "Payment summary" : "FREE ENTRY"}</strong>
          <div class="ledger">
            <div><span>Base registration</span><strong>${money(fee)}</strong></div>
            <div><span>Gateway and tax</span><strong>${money(gateway)}</strong></div>
            <div class="total"><span>Total payable</span><strong>${money(total)}</strong></div>
          </div>
        </div>
        ${fee ? `
          <div class="upi-hint-strip">
            ${msIcon("qr_code", "upi-hint-icon")}
            <span>A UPI QR code will appear for instant payment</span>
          </div>
        ` : ""}
        <button class="primary" id="submitRegistration" style="width:100%; margin-top:14px;">${fee ? msIcon("qr_code", "small-icon") + " Pay & Generate QR" : "Confirm registration"}</button>
      `}
    </section>
  `;
}

function renderMyRegistrations() {
  const regs = userRegistrations();
  
  let listContent = "";
  if (state.isLoading) {
    listContent = Array(3).fill(0).map(() => `
      <article class="list-row" style="padding: 12px; display:flex; flex-direction:column; gap:8px;">
        <div class="skeleton skeleton-text" style="width: 70%; margin:0;"></div>
        <div class="skeleton skeleton-text" style="width: 40%; margin:0;"></div>
      </article>
    `).join("");
  } else if (regs.length === 0) {
    listContent = `
      <div class="empty-state" style="padding: 30px 10px; min-height: 120px;">
        ${msIcon("how_to_reg", "app-icon")}
        <p style="margin-bottom:0;">You haven't registered for any events yet.</p>
      </div>
    `;
  } else {
    listContent = regs.map((reg) => `<article class="list-row"><h4>${eventName(reg.eventId)}</h4><p class="small-meta">${reg.transactionId} | ${reg.paymentMethod}</p><span class="tag ${reg.status === "Approved" ? "light" : reg.status === "Rejected" ? "red" : "gold"}">${reg.status}</span></article>`).join("");
  }

  return `
    <section class="section">
      <div class="section-head"><h3>My registrations</h3></div>
      <div class="list compact-list">
        ${listContent}
      </div>
    </section>
  `;
}

function renderPasses() {
  const regs = userRegistrations();
  const approvedReg = regs.find((reg) => reg.status === "Approved");
  if (!regs.length) return `
    <div class="empty-state">
      ${msIcon("qr_code_scanner", "empty-icon")}
      <p>No passes yet. Register for an event to generate one.</p>
    </div>
  `;
  return `
    <section class="content-grid">
      <div class="list">
        ${regs.map((reg) => {
          const checked = state.attendance.some((row) => row.registrationId === reg.id);
          const statusColor = checked ? "light" : reg.status === "Approved" ? "blue" : reg.status === "Rejected" ? "red" : "gold";
          return `
            <article class="list-row pass-list-row">
              <div class="pass-row-content">
                <div class="pass-row-left">
                  <span class="pass-event-dot cat-dot-${(state.events.find(e=>e.id===reg.eventId)?.category||'').toLowerCase()}"></span>
                  <div>
                    <h4>${eventName(reg.eventId)}</h4>
                    <p class="small-meta">Transaction: ${reg.transactionId} | ${reg.paymentMethod}</p>
                  </div>
                </div>
                <span class="tag ${statusColor} pass-status-chip">
                  ${checked ? msIcon("check_circle") + " Checked In" : reg.status}
                </span>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      <aside class="pass-panel ticket-panel">
        <h3>Your TechnoCraft Pass</h3>
        ${approvedReg ? `
          ${renderTicket(approvedReg)}
          <div class="pass-actions">
            <button class="primary" id="downloadPass">${msIcon("download", "small-icon")}Download Pass</button>
            ${navigator.share ? `<button class="secondary" id="sharePass">${msIcon("share", "small-icon")}Share</button>` : ""}
          </div>
        ` : renderTicket(regs[0])}
        <p class="small-meta" style="margin-top:10px;">Show this QR at the venue gate for instant entry.</p>
      </aside>
    </section>
  `;
}

function renderTicket(reg) {
  const event = state.events.find((e) => e.id === reg.eventId);
  const isApproved = reg.status === "Approved";
  return `
    <div class="ticket ${isApproved ? "ticket-approved" : ""}" id="ticketEl">
      <div class="ticket-top">
        <span>TECHNOCRAFT ENTRY PASS</span>
        <strong>${eventName(reg.eventId)}</strong>
        <small>${reg.studentName}</small>
        ${event ? `<small>${event.date}, 2026 | ${event.venue}</small>` : ""}
      </div>
      <div class="qr-large-wrap">
        ${renderQr(reg)}
      </div>
      <div class="ticket-status-row">
        <span class="ticket-status-chip ${isApproved ? "chip-approved" : reg.status === "Rejected" ? "chip-rejected" : "chip-pending"}">
          ${isApproved ? msIcon("check_circle") : reg.status === "Rejected" ? msIcon("cancel") : msIcon("hourglass_empty")}
          ${reg.status}
        </span>
        <span class="ticket-code">${reg.transactionId}</span>
      </div>
    </div>
    ${isApproved ? `<div id="confetti-trigger" style="display:none;"></div>` : ""}
  `;
}

function renderQr(reg) {
  // Try to find the cryptographically signed pass generated in Phase B/C
  const pass = state.passes ? state.passes.find((p) => p.registrationId === reg.id) : null;
  const payload = pass 
    ? `${pass.token}::${pass.payload}::${pass.signature}::${pass.eventId}` 
    : `TECHNOCRAFT::${reg.studentId}::${reg.eventId}::${reg.id}::${reg.transactionId}`;
  
  // Use a unique container ID per registration
  const containerId = `qr-pass-${reg.id}`;
  // Schedule real QR rendering after DOM update
  requestAnimationFrame(() => {
    const el = document.getElementById(containerId);
    if (el && window.QRCode && !el.dataset.rendered) {
      el.dataset.rendered = "1";
      el.innerHTML = "";
      new window.QRCode(el, {
        text: payload,
        width: 180,
        height: 180,
        colorDark: reg.status === "Approved" ? "#0f7b63" : "#555",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  });
  return `<div id="${containerId}" class="qr-real-wrap" title="${payload}"><div class="qr-placeholder-dots"></div></div>`;
}

function renderNotifications() {
  const notes = state.notifications.filter((note) => note.userId === state.currentUser.id);
  return `<section class="list">${notes.map((note) => `<article class="list-row"><h4>${note.title}</h4><p class="small-meta">${note.message}</p><span class="tag ${note.isRead ? "blue" : "light"}">${note.timestamp}</span></article>`).join("") || `<div class="empty">No notifications yet.</div>`}</section>`;
}

function renderProfile() {
  const user = state.currentUser;
  const regs = userRegistrations();
  const checkedIn = state.attendance.filter((row) => row.studentId === user.id).length;
  const skillList = (user.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  return `
    <section class="content-grid">
      <div class="form-panel profile-panel">
        <!-- Avatar hero -->
        <div class="profile-hero-new">
          <div class="profile-avatar-lg">${initials(user.name)}</div>
          <div class="profile-hero-info">
            <h3>${user.name}</h3>
            <p class="small-meta">${user.email}</p>
            <span class="tag light">${user.role} &bull; ${user.branch || user.department || "Campus"}</span>
          </div>
        </div>
        <div class="data-table profile-stats">
          <div><span>Roll number</span><strong>${user.rollNo || "NA"}</strong></div>
          <div><span>Branch</span><strong>${user.branch || "Campus"}</strong></div>
          <div><span>Year</span><strong>${user.year ? `Year ${user.year}` : "NA"}</strong></div>
          <div><span>Phone</span><strong>${user.phoneNumber || "NA"}</strong></div>
        </div>
        <!-- Skills chips -->
        ${skillList.length ? `
          <div class="skills-section">
            <p class="eyebrow" style="margin-bottom:8px;">Skills</p>
            <div class="skills-chips">
              ${skillList.map((s) => `<span class="skill-chip">${s}</span>`).join("")}
            </div>
          </div>
        ` : ""}
        <!-- Certificates section -->
        <div class="certs-section">
          <p class="eyebrow" style="margin:16px 0 8px;">Certificates</p>
          ${checkedIn > 0 ? `
            <div class="cert-list">
              ${state.attendance.filter((row) => row.studentId === user.id).map((row) => {
                const cert = state.certificates ? state.certificates.find((c) => c.eventId === row.eventId && c.studentId === user.id) : null;
                const url = cert ? cert.pdfUrl : "#";
                const downloadAttr = cert ? `target="_blank"` : `onclick="showToast('Offline Mode: Certificate mock generated locally.', 'success')"`;
                return `
                  <div class="cert-row">
                    ${msIcon("workspace_premium", "cert-icon")}
                    <span>${eventName(row.eventId)}</span>
                    <a href="${url}" ${downloadAttr} class="button secondary cert-download-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                      ${msIcon("download", "small-icon")}
                      <span>Download</span>
                    </a>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `<p class="small-meta">Attend an event to earn your certificate.</p>`}
        </div>
        <div class="account-actions">
          <button class="secondary" id="profileNotifications">${msIcon("notifications", "small-icon")}Notifications</button>
          <button class="danger" id="logoutBtn">${msIcon("logout", "small-icon")}Sign out</button>
        </div>
      </div>
      <aside>${renderNotifications()}</aside>
    </section>
  `;
}

function renderCoordinator() {
  const tab = state.activeTab;
  if (tab === "Create") return `${renderHeader("Create event", "Publish free or paid events into the student feed.")}${renderCreateEvent()}`;
  if (tab === "Registrations") return `${renderHeader("Approval queue", "Review student submissions with fast status filters.")}${renderApprovalQueue()}`;
  if (tab === "Scanner") return `${renderHeader("Live check-in", "Focused scanner mode for venue entry desks.")}${renderScanner()}`;
  if (tab === "Reports") return `${renderHeader("Coordinator reports", "Track capacity, payment, and attendance for your events.")}${renderReports(false)}`;
  const pending = state.registrations.filter((reg) => reg.status === "Pending").length;
  return `
    ${renderHeader("Coordinator dashboard", "Operate events from publication through live attendance.")}
    <section class="stats-grid">
      ${metric("Events", state.events.length)}
      ${metric("Registrations", state.registrations.length)}
      ${metric("Pending", pending)}
      ${metric("Checked in", state.attendance.length)}
    </section>
    ${pending > 0 ? `<div class="coord-alert">${msIcon("pending_actions")} <strong>${pending} registration${pending > 1 ? "s" : ""} awaiting approval</strong> — <button class="text-link" data-tab="Registrations">Review now</button></div>` : ""}
    ${renderApprovalQueue(true)}
  `;
}

function renderCreateEvent() {
  return `
    <section class="form-panel">
      <div class="field-grid">
        <div class="field"><label for="eventName">Event title</label><input id="eventName" value="TechnoCraft Innovation Talk" /></div>
        <div class="field"><label for="eventCategory">Category</label><select id="eventCategory"><option>Technical</option><option>Non-Technical</option><option>Cultural</option><option>Sports</option></select></div>
        <div class="field"><label for="eventDate">Date</label><input id="eventDate" value="Aug 02" /></div>
        <div class="field"><label for="eventTime">Time</label><input id="eventTime" value="11:00 AM" /></div>
        <div class="field"><label for="eventVenue">Venue</label><input id="eventVenue" value="Seminar Hall" /></div>
        <div class="field"><label for="eventFee">Entry fee</label><input id="eventFee" type="number" value="0" /></div>
        <div class="field full"><label for="eventDescription">Description</label><textarea id="eventDescription">A focused event for students with interactive sessions and certification.</textarea></div>
        <div class="field full"><label for="eventRules">Rules and schedule</label><textarea id="eventRules">Bring ID card. Check-in starts 30 minutes early.</textarea></div>
      </div>
      <button class="primary" id="createEvent" style="margin-top:16px;">Publish event</button>
    </section>
  `;
}

function renderApprovalQueue(limit = false) {
  const filtered = state.regStatusFilter === "All" ? state.registrations : state.registrations.filter((reg) => reg.status === state.regStatusFilter);
  const regs = limit ? filtered.slice(0, 4) : filtered;
  if (!limit) {
    // Full Kanban board
    const cols = ["Pending", "Approved", "Rejected"];
    return `
      <div class="kanban-toolbar">
        <div class="tabs">
          ${["Pending", "Approved", "Rejected", "All"].map((s) => `<button class="tab-btn regFilter ${state.regStatusFilter === s ? "active" : ""}" data-status="${s}">${s}</button>`).join("")}
        </div>
        <button class="secondary" id="exportReport">${msIcon("download", "small-icon")}Export CSV</button>
      </div>
      <div class="kanban-board">
        ${cols.map((col) => {
          const colRegs = state.registrations.filter((r) => r.status === col);
          return `
            <div class="kanban-col">
              <div class="kanban-col-head">
                <span class="kanban-dot dot-${col.toLowerCase()}"></span>
                <strong>${col}</strong>
                <span class="kanban-count">${colRegs.length}</span>
              </div>
              <div class="kanban-cards">
                ${colRegs.map((reg) => `
                  <div class="kanban-card">
                    <p class="kanban-student">${msIcon("person")} ${reg.studentName}</p>
                    <p class="kanban-event small-meta">${eventName(reg.eventId)}</p>
                    <p class="small-meta">Team: ${reg.teamName} | ${reg.transactionId}</p>
                    <div class="row-actions">
                      ${col !== "Approved" ? `<button class="primary approveReg" data-reg="${reg.id}">Approve</button>` : ""}
                      ${col !== "Rejected" ? `<button class="danger rejectReg" data-reg="${reg.id}">Reject</button>` : ""}
                    </div>
                  </div>
                `).join("") || `<p class="small-meta" style="padding:12px;">None</p>`}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
  // Compact list for dashboard
  return `
    <div class="tabs">
      ${["Pending", "Approved", "Rejected", "All"].map((status) => `<button class="tab-btn regFilter ${state.regStatusFilter === status ? "active" : ""}" data-status="${status}">${status}</button>`).join("")}
    </div>
    <section class="list">
      ${regs.map((reg) => `
        <article class="list-row queue-row">
          <div>
            <h4>${reg.studentName} — ${eventName(reg.eventId)}</h4>
            <p class="small-meta">Team: ${reg.teamName} | ${reg.paymentMethod}, ${reg.transactionId}</p>
          </div>
          <span class="tag ${reg.status === "Approved" ? "light" : reg.status === "Rejected" ? "red" : "gold"}">${reg.status}</span>
          <div class="row-actions">
            <button class="primary approveReg" data-reg="${reg.id}">Approve</button>
            <button class="danger rejectReg" data-reg="${reg.id}">Reject</button>
          </div>
        </article>
      `).join("") || `<div class="empty-state">${msIcon("task_alt", "empty-icon")}<p>No ${state.regStatusFilter.toLowerCase()} registrations.</p></div>`}
    </section>
  `;
}

function renderScanner() {
  const approved = state.registrations.filter((reg) => reg.status === "Approved");
  const isScanning = state.isScanning;

  return `
    <section class="scanner-layout">
      <div class="scanner-stage">
        <div class="scan-frame-new ${isScanning ? "scanning-active" : ""}">
          <div id="qr-reader" style="width: 100%; max-width: 320px; margin: 0 auto; overflow: hidden; border-radius: 8px;"></div>
          ${!isScanning ? `
            <div class="scanner-placeholder">
              ${msIcon("photo_camera", "placeholder-cam-icon")}
              <p>Camera is off</p>
            </div>
          ` : `
            <div class="scanner-laser"></div>
          `}
        </div>
        <div class="scanner-controls" style="margin-top: 16px; display:flex; flex-direction:column; align-items:center; gap:12px; width: 100%;">
          <div class="field" style="max-width: 320px; width: 100%;">
            <label for="cameraSelect">Select Camera</label>
            <select id="cameraSelect" ${isScanning ? "disabled" : ""}>
              <option value="">Detecting cameras...</option>
            </select>
          </div>
          <button class="${isScanning ? "danger" : "primary"}" id="toggleScanBtn" style="max-width: 320px; width: 100%;">
            ${msIcon(isScanning ? "videocam_off" : "videocam", "small-icon")}
            <span>${isScanning ? "Stop Scanning" : "Start Live Scanner"}</span>
          </button>
        </div>
      </div>
      <div class="form-panel">
        <h3>Manual checkout</h3>
        <div class="field">
          <label for="scanRegistration">Approved registration ID / Roll no</label>
          <select id="scanRegistration">
            ${approved.map((reg) => `<option value="${reg.id}">${reg.studentName} - ${eventName(reg.eventId)}</option>`).join("")}
          </select>
        </div>
        <button class="primary" id="scanBtn" style="margin-top:14px; width: 100%;">Confirm check-in</button>
        ${state.scanResult ? `
          <div class="scan-result-card ${state.scanResult.startsWith("SUCCESS") ? "scan-success" : state.scanResult.startsWith("ERROR") ? "scan-error" : ""}">
            ${state.scanResult}
          </div>
        ` : ""}
      </div>
    </section>
  `;
}

function renderAdmin() {
  const tab = state.activeTab;
  if (tab === "Students") return `${renderHeader("Students", "Searchable student account and registration history.")}${renderAdminTable("Student")}`;
  if (tab === "Coords") return `${renderHeader("Coordinators", "Department and category authority control.")}${renderAdminTable("Coordinator")}`;
  if (tab === "Events") return `${renderHeader("Event catalog", "Master authority over every published event.")}${renderEventCatalog(false)}`;
  if (tab === "Reports") return `${renderHeader("Master reports", "Campus-wide registration, finance, and attendance analytics.")}${renderReports(true)}`;
  const revenue = state.registrations.reduce((sum, reg) => sum + (state.events.find((event) => event.id === reg.eventId)?.entryFee || 0), 0);
  const pending = state.registrations.filter((r) => r.status === "Pending").length;
  const approved = state.registrations.filter((r) => r.status === "Approved").length;
  return `
    ${renderHeader("Admin control room", "Compact analytics and management views for the whole TechnoCraft system.")}
    <section class="stats-grid">
      ${metric("Students", state.users.filter((u) => u.role === "Student").length)}
      ${metric("Coordinators", state.users.filter((u) => u.role === "Coordinator").length)}
      ${metric("Events", state.events.length)}
      ${metric("Revenue", money(revenue))}
    </section>
    <!-- Finance overview card -->
    <div class="finance-card">
      <div class="finance-item">
        ${msIcon("payments", "finance-icon")}
        <div><span class="small-meta">Total collected</span><strong>${money(revenue)}</strong></div>
      </div>
      <div class="finance-item">
        ${msIcon("pending_actions", "finance-icon")}
        <div><span class="small-meta">Awaiting approval</span><strong>${pending}</strong></div>
      </div>
      <div class="finance-item">
        ${msIcon("how_to_reg", "finance-icon")}
        <div><span class="small-meta">Active passes</span><strong>${approved}</strong></div>
      </div>
      <div class="finance-item">
        ${msIcon("co_present", "finance-icon")}
        <div><span class="small-meta">Check-ins</span><strong>${state.attendance.length}</strong></div>
      </div>
    </div>
    <!-- Activity log -->
    <section class="control-grid">
      ${renderReports(true)}
      <div class="report-panel activity-log-panel">
        <h3>Activity log</h3>
        <div class="activity-log">
          ${[...state.notifications].reverse().slice(0, 8).map((n) => `
            <div class="activity-row">
              ${msIcon("circle", "activity-dot")}
              <div>
                <p style="margin:0;font-size:0.86rem;">${n.title}</p>
                <span class="small-meta">${n.timestamp}</span>
              </div>
            </div>
          `).join("") || `<p class="small-meta">No activity yet.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderUserList(role) {
  const users = state.users.filter((user) => user.role === role);
  return `<section class="list">${users.map((user) => `<article class="list-row"><h4>${user.name}</h4><p class="small-meta">${user.email}<br>${user.branch || user.department || "Campus"} ${user.year ? `| Year ${user.year}` : ""}</p><span class="tag light">Active</span></article>`).join("")}</section>`;
}

function renderAdminTable(role) {
  const query = (state.adminUserSearch || "").toLowerCase();
  const users = state.users.filter((user) => user.role === role && (!query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)));
  return `
    <section class="report-panel">
      <div class="admin-search-bar">
        <div class="search-wrap" style="max-width:320px;">
          ${msIcon("search", "search-icon")}
          <input id="adminUserSearch" type="search" value="${state.adminUserSearch}" placeholder="Search by name or email..." />
        </div>
      </div>
      <div class="table-head">
        <strong>Name</strong><strong>Email</strong><strong>Profile</strong><strong>Status</strong>
      </div>
      ${users.map((user) => `
        <div class="table-row">
          <span class="table-avatar-name"><span class="user-avatar-sm">${initials(user.name)}</span>${user.name}</span>
          <span>${user.email}</span>
          <span>${user.branch || user.department || "Campus"}${user.year ? `, Year ${user.year}` : ""}</span>
          <span class="tag light">Active</span>
        </div>
      `).join("") || `<p class="small-meta" style="padding:14px;">No ${role.toLowerCase()}s match your search.</p>`}
    </section>
  `;
}

function renderReports(admin) {
  const categories = ["Technical", "Non-Technical", "Cultural", "Sports"];
  const totalRegs = Math.max(1, state.registrations.length);
  return `
    <section class="report-panel">
      <h3>${admin ? "Campus performance" : "Event performance"}</h3>
      <div class="bars">
        ${categories.map((category) => {
          const count = state.registrations.filter((reg) => state.events.find((event) => event.id === reg.eventId)?.category === category).length;
          const pct = Math.round((count / totalRegs) * 100);
          return `<div class="bar"><div class="bar-label"><span>${category}</span><strong>${count} registrations</strong></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></div>`;
        }).join("")}
      </div>
      <div class="toolbar">
        <button class="secondary" id="exportReport">Export report</button>
        <span class="small-meta">${state.attendance.length} attendance logs recorded</span>
      </div>
    </section>
  `;
}

function metric(label, value, icon = "") {
  const numVal = typeof value === "number" ? value : null;
  return `<article class="metric" ${numVal !== null ? `data-count="${numVal}"` : ""}>
    ${icon ? `<div class="metric-icon">${msIcon(icon, "metric-icon-sym")}</div>` : ""}
    <span>${label}</span>
    <strong class="metric-val">${value}</strong>
    <i></i>
  </article>`;
}

async function submitRegistration(eventId = state.selectedEventId, txnIdOverride = null) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event || userRegistrations().some((reg) => reg.eventId === event.id)) return;

  // Validation
  const teamName = byId("teamName")?.value.trim();
  const docs = byId("docs")?.value.trim();
  if (!teamName && byId("teamName")) return showToast("Team name is required.", "warning");
  if (!docs && byId("docs")) return showToast("Document link is required.", "warning");

  const paymentMethod = byId("paymentMethod")?.value || "UPI";
  const fee = Number(event.entryFee);

  // ---- For paid events: show UPI QR modal first ----
  if (fee && !txnIdOverride && paymentMethod === "UPI") {
    // Show the UPI payment modal
    setState({ upiModalOpen: true, upiModalEventId: eventId, upiPaymentStep: "qr", upiTxnId: "" });
    return;
  }

  // ---- Route through Cloud Function if available ----
  if (window.TechnoCraftCloud?.functionsEnabled()) {
    try {
      showToast("Submitting registration...", "info");
      const result = await window.TechnoCraftCloud.callFunction("processRegistration", {
        eventId,
        teamName: teamName || "Solo",
        docs: docs || "",
        paymentMethod
      });
      if (result.status === "waitlisted") {
        return showToast(result.message, "warning");
      }
      showToast("Registration submitted successfully!", "success");
      setState({ selectedEventId: event.id, isLoading: true, upiModalOpen: false });
      // Reload state from Firestore to reflect server-created registration
      const fresh = await window.TechnoCraftCloud.loadState(state);
      if (fresh) state = { ...state, ...fresh, currentUser: state.currentUser, isLoading: false };
      setState({});
    } catch (error) {
      showToast(`Registration failed: ${error.message}`, "error");
    }
    return;
  }

  // ---- Offline / Demo mode fallback ----
  const txnId = txnIdOverride || (fee ? `TXN-${Math.floor(100000 + Math.random() * 900000)}` : `FREE-${Math.floor(1000 + Math.random() * 9000)}`);
  const reg = {
    id: `reg-${Date.now()}`,
    eventId: event.id,
    studentId: state.currentUser.id,
    studentName: state.currentUser.name,
    studentEmail: state.currentUser.email,
    status: fee ? "Pending" : "Approved",
    paymentMethod: fee ? paymentMethod : "Free",
    paymentStatus: fee ? "Paid" : "Free",
    transactionId: txnId,
    teamName: teamName || "Solo",
    docs: docs || "Not provided"
  };
  state.registrations.push(reg);
  const note = {
    id: `note-${Date.now()}`,
    userId: state.currentUser.id,
    title: `${event.name} ${reg.status.toLowerCase()}`,
    message: fee ? "Payment received. Awaiting coordinator approval." : "Your free pass is ready.",
    timestamp: "Now",
    isRead: false
  };
  state.notifications.push(note);
  setState({ selectedEventId: event.id, upiModalOpen: false });
  showToast(fee ? "Payment confirmed! Registration submitted. ✓" : "Registration submitted!", "success");
}

// ---- UPI Payment Config ----
const UPI_CONFIG = {
  vpa: "technocraft2026@upi",        // Replace with real UPI VPA
  merchant: "TechnoCraft Events",
  currency: "INR"
};

function buildUpiUrl(amount, eventName, txnRef) {
  const params = new URLSearchParams({
    pa: UPI_CONFIG.vpa,
    pn: UPI_CONFIG.merchant,
    am: amount.toFixed(2),
    cu: UPI_CONFIG.currency,
    tn: `TechnoCraft: ${eventName}`.slice(0, 80),
    tr: txnRef
  });
  return `upi://pay?${params.toString()}`;
}

function renderUpiModal() {
  if (!state.upiModalOpen) return "";
  const event = state.events.find(e => e.id === state.upiModalEventId);
  if (!event) return "";
  const fee = Number(event.entryFee);
  const gateway = fee * 0.15;
  const total = fee + gateway;
  const txnRef = `TC${Date.now().toString(36).toUpperCase()}`;
  const upiUrl = buildUpiUrl(total, event.name, txnRef);
  const qrContainerId = "upi-qr-code-container";

  // Render real QR after DOM paints
  requestAnimationFrame(() => {
    const el = document.getElementById(qrContainerId);
    if (el && window.QRCode && !el.dataset.rendered) {
      el.dataset.rendered = "1";
      el.innerHTML = "";
      new window.QRCode(el, {
        text: upiUrl,
        width: 200,
        height: 200,
        colorDark: "#0f7b63",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  });

  const step = state.upiPaymentStep;

  return `
    <div class="upi-modal-backdrop" id="upiModalBackdrop">
      <div class="upi-modal" role="dialog" aria-modal="true" aria-label="UPI Payment">
        <!-- Header -->
        <div class="upi-modal-header">
          <div class="upi-modal-title-group">
            ${msIcon("payments", "upi-header-icon")}
            <div>
              <h3>UPI Payment</h3>
              <p class="small-meta">${event.name}</p>
            </div>
          </div>
          <button class="icon-btn" id="closeUpiModal" aria-label="Close payment">${msIcon("close")}</button>
        </div>

        <!-- Step indicator -->
        <div class="upi-steps">
          <div class="upi-step ${step === "qr" ? "active" : "done"}">
            ${step !== "qr" ? msIcon("check_circle", "step-done-icon") : `<span class="step-num">1</span>`}
            <span>Scan & Pay</span>
          </div>
          <div class="upi-step-line"></div>
          <div class="upi-step ${step === "confirm" ? "active" : ""}">
            <span class="step-num">2</span>
            <span>Confirm</span>
          </div>
        </div>

        <!-- Step 1: QR Code -->
        ${step === "qr" ? `
          <div class="upi-qr-section">
            <div class="upi-amount-badge">
              ${msIcon("currency_rupee", "rupee-icon")}
              <span>${money(total)}</span>
              <small>incl. gateway fee</small>
            </div>
            <div class="upi-qr-frame">
              <div id="${qrContainerId}" class="upi-qr-inner">
                <div class="qr-loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <p class="upi-qr-label">Scan with any UPI app</p>
              <div class="upi-app-logos">
                <span class="upi-app-pill">📱 GPay</span>
                <span class="upi-app-pill">💜 PhonePe</span>
                <span class="upi-app-pill">🔵 Paytm</span>
                <span class="upi-app-pill">🏦 BHIM</span>
              </div>
            </div>
            <div class="upi-divider"><span>OR</span></div>
            <div class="upi-vpa-row">
              <div class="upi-vpa-box">
                ${msIcon("account_balance_wallet", "vpa-icon")}
                <span id="upiVpaText">${UPI_CONFIG.vpa}</span>
              </div>
              <button class="secondary" id="copyUpiId" style="min-height:38px;padding:0 14px;font-size:0.82rem;">
                ${msIcon("content_copy", "small-icon")}Copy UPI ID
              </button>
            </div>
            <a class="upi-pay-link" href="${upiUrl}" target="_blank" rel="noopener" id="openUpiApp">
              ${msIcon("open_in_new", "small-icon")} Open in UPI App
            </a>
          </div>
          <div class="upi-modal-footer">
            <p class="small-meta" style="text-align:center;margin-bottom:12px;">Paid successfully? Click below to confirm your registration.</p>
            <button class="primary" id="upiPaidBtn" style="width:100%;">
              ${msIcon("check_circle", "small-icon")} I've Paid — Continue
            </button>
          </div>
        ` : `
          <!-- Step 2: Confirm Transaction -->
          <div class="upi-confirm-section">
            ${msIcon("verified", "upi-confirm-icon")}
            <h4>Confirm your payment</h4>
            <p class="small-meta" style="text-align:center;">Enter the UPI Transaction ID from your payment app to complete registration.</p>
            <div class="field" style="margin-top:20px;">
              <label for="upiTxnInput">UPI Transaction ID</label>
              <div class="auth-input-wrap">
                ${msIcon("receipt_long", "auth-input-icon")}
                <input
                  id="upiTxnInput"
                  type="text"
                  class="auth-input"
                  placeholder="e.g. 324567891234 or UTR12345"
                  value="${state.upiTxnId}"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="upi-summary-box">
              <div><span>Event</span><strong>${event.name}</strong></div>
              <div><span>UPI ID</span><strong>${UPI_CONFIG.vpa}</strong></div>
              <div><span>Amount paid</span><strong class="upi-total-highlight">${money(total)}</strong></div>
            </div>
          </div>
          <div class="upi-modal-footer">
            <button class="secondary" id="upiBackBtn" style="flex:1;">${msIcon("arrow_back", "small-icon")} Back</button>
            <button class="primary" id="upiConfirmBtn" style="flex:2;">
              ${msIcon("how_to_reg", "small-icon")} Complete Registration
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

function updateRegistration(id, status) {
  const reg = state.registrations.find((item) => item.id === id);
  if (!reg) return;
  reg.status = status;
  const note = {
    id: `note-${Date.now()}`,
    userId: reg.studentId,
    title: `${eventName(reg.eventId)} ${status.toLowerCase()}`,
    message: status === "Approved" ? "Your QR pass has been unlocked." : "Your registration was rejected by the coordinator.",
    timestamp: "Now",
    isRead: false
  };
  state.notifications.push(note);
  syncCollection("registrations", reg);
  syncCollection("notifications", note);
  setState({});
}

function createEvent() {
  const name = byId("eventName")?.value.trim();
  const date = byId("eventDate")?.value.trim();
  const time = byId("eventTime")?.value.trim();
  const venue = byId("eventVenue")?.value.trim();
  
  if (!name || !date || !time || !venue) {
    return showToast("Please fill all required event details.", "warning");
  }

  const event = {
    id: `event-${Date.now()}`,
    name: byId("eventName").value,
    category: byId("eventCategory").value,
    date: byId("eventDate").value,
    time: byId("eventTime").value,
    venue: byId("eventVenue").value,
    description: byId("eventDescription").value,
    rules: byId("eventRules").value,
    schedule: byId("eventRules").value,
    entryFee: Number(byId("eventFee").value || 0),
    createdBy: state.currentUser.id,
    capacity: 100
  };
  state.events.unshift(event);
  syncCollection("events", event);
  setState({ activeTab: "Home", selectedEventId: event.id });
}

async function scanRegistration(scannedVal = null) {
  const rawData = scannedVal || byId("scanRegistration")?.value;
  if (!rawData) return;

  // If scanning via Cloud Functions (using the cryptographically signed token)
  if (window.TechnoCraftCloud?.functionsEnabled() && scannedVal) {
    try {
      setState({ scanResult: "Verifying pass with server..." });
      // Format scanned: token|payload|signature|eventId
      const parts = rawData.split("::");
      if (parts.length < 4) {
        throw new Error("Invalid QR pass format.");
      }
      const [qrToken, qrPayload, qrSignature, eventId] = parts;

      const result = await window.TechnoCraftCloud.callFunction("validateQRScan", {
        qrToken,
        qrSignature,
        qrPayload,
        eventId
      });

      setState({ scanResult: `SUCCESS: ${result.message}` });
      showToast(result.message, "success");
      
      // Reload state from database
      const fresh = await window.TechnoCraftCloud.loadState(state);
      if (fresh) state = { ...state, ...fresh, currentUser: state.currentUser };
      setState({});
    } catch (error) {
      const errMsg = error.message.replace("Firebase: ", "");
      setState({ scanResult: `ERROR: ${errMsg}` });
      showToast(errMsg, "error");
    }
    return;
  }

  // Offline / Dropdown fallback
  const reg = state.registrations.find((item) => item.id === rawData || `${item.studentId}-${item.eventId}-${item.id}` === rawData);
  if (!reg) {
    setState({ scanResult: "ERROR: Ticket registration not found." });
    return showToast("Ticket not found.", "error");
  }

  const existing = state.attendance.find((row) => row.registrationId === reg.id);
  if (existing) {
    setState({ scanResult: `ERROR: Already checked in at ${existing.scannedAt}` });
    return showToast("Pass already scanned.", "warning");
  }

  const attendance = {
    id: `att-${Date.now()}`,
    registrationId: reg.id,
    eventId: reg.eventId,
    studentId: reg.studentId,
    scannedAt: new Date().toLocaleString(),
    scannedBy: state.currentUser.id
  };
  state.attendance.push(attendance);
  syncCollection("attendance", attendance);

  // Auto-approve registration locally if it was pending
  if (reg.status !== "Approved") {
    reg.status = "Approved";
    syncCollection("registrations", reg);
  }

  setState({ scanResult: `SUCCESS: Check-in recorded for ${reg.studentName} (${eventName(reg.eventId)}).` });
  showToast("Check-in successful!", "success");
}

function exportReport() {
  const rows = [
    ["Metric", "Value"],
    ["Users", state.users.length],
    ["Events", state.events.length],
    ["Registrations", state.registrations.length],
    ["Attendance", state.attendance.length]
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "technocraft-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.querySelectorAll(".skipSplash").forEach((button) => button.addEventListener("click", () => {
    if (splashTimer) window.clearTimeout(splashTimer);
    splashTimer = null;
    setState({ showSplash: false });
  }));
  document.querySelectorAll("[data-role]").forEach((button) => button.addEventListener("click", () => setState({ authRole: button.dataset.role })));
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
    if (!state.currentUser) return setState({ currentUser: null, authStep: "role", activeTab: "Home" });
    const allowedTabs = navFor(state.currentUser.role).map((nav) => nav.label);
    if (!allowedTabs.includes(button.dataset.tab)) return setState({ activeTab: allowedTabs[0], scanResult: "" });
    setState({ activeTab: button.dataset.tab, scanResult: "" });
  }));
  document.querySelectorAll(".categoryFilter").forEach((button) => button.addEventListener("click", () => setState({ eventCategoryFilter: button.dataset.category })));
  byId("eventSearch")?.addEventListener("input", (event) => setState({ eventSearch: event.target.value }));
  byId("eventSort")?.addEventListener("change", (e) => setState({ eventSortBy: e.target.value }));
  document.querySelectorAll(".view-btn").forEach((button) => button.addEventListener("click", () => setState({ eventViewMode: button.dataset.view })));
  document.querySelectorAll(".regFilter").forEach((button) => button.addEventListener("click", () => setState({ regStatusFilter: button.dataset.status })));
  document.querySelectorAll(".selectEvent").forEach((button) => button.addEventListener("click", () => setState({ selectedEventId: button.dataset.event })));
  document.querySelectorAll(".viewDetails").forEach((button) => button.addEventListener("click", () => setState({ selectedEventId: button.dataset.event, activeTab: "Events", eventScreenMode: "details" })));
  document.querySelectorAll(".backToEvents").forEach((button) => button.addEventListener("click", () => setState({ activeTab: "Events", eventScreenMode: "list" })));
  document.querySelectorAll(".openProfile").forEach((button) => button.addEventListener("click", () => {
    const allowedTabs = navFor(state.currentUser?.role).map((nav) => nav.label);
    setState({ activeTab: allowedTabs.includes("Profile") ? "Profile" : allowedTabs[0] });
  }));
  document.querySelectorAll(".quickRegister").forEach((button) => button.addEventListener("click", () => {
    state.selectedEventId = button.dataset.event;
    submitRegistration(button.dataset.event);
    showToast("Registration submitted!", "success");
  }));
  document.querySelectorAll(".approveReg").forEach((button) => button.addEventListener("click", () => {
    updateRegistration(button.dataset.reg, "Approved");
    showToast("Registration approved ✓", "success");
  }));
  document.querySelectorAll(".rejectReg").forEach((button) => button.addEventListener("click", () => {
    updateRegistration(button.dataset.reg, "Rejected");
    showToast("Registration rejected", "warning");
  }));
  byId("toggleAuth")?.addEventListener("click", () => setState({ authMode: state.authMode === "login" ? "register" : "login" }));
  byId("loginBtn")?.addEventListener("click", () => login(state.authRole));
  byId("logoutBtn")?.addEventListener("click", logout);
  byId("togglePw")?.addEventListener("click", () => {
    const pw = byId("password");
    const icon = byId("togglePw")?.querySelector(".app-icon");
    if (!pw) return;
    const isHidden = pw.type === "password";
    pw.type = isHidden ? "text" : "password";
    if (icon) icon.textContent = isHidden ? "visibility_off" : "visibility";
  });
  // Dark mode toggle (sidebar + header button)
  document.querySelectorAll(".darkToggleBtn, #darkToggleBtn").forEach((button) => button.addEventListener("click", () => {
    setState({ darkMode: !state.darkMode });
    showToast(state.darkMode ? "Dark mode on 🌙" : "Light mode on ☀️", "info");
  }));
  document.querySelectorAll(".quickSignOut").forEach((button) => button.addEventListener("click", logout));
  byId("profileNotifications")?.addEventListener("click", () => setState({ activeTab: "Profile" }));
  byId("submitRegistration")?.addEventListener("click", async () => {
    const event = state.events.find((item) => item.id === state.selectedEventId);
    const fee = Number(event?.entryFee || 0);
    const chosenPaymentMethod = byId("paymentMethod")?.value || "UPI";

    // Free events — standard registration flow
    if (!fee) {
      await submitRegistration();
      return;
    }

    // UPI / QR Code — show our in-app UPI QR modal
    if (chosenPaymentMethod === "UPI") {
      await submitRegistration(); // This will open the modal
      return;
    }

    // KnitPayUPI via Cloud Functions
    if (chosenPaymentMethod === "KnitPayUPI" && window.TechnoCraftCloud?.functionsEnabled()) {
      const teamName = byId("teamName")?.value.trim();
      const docs = byId("docs")?.value.trim();
      try {
        showToast("Initiating Knit Pay UPI...", "info");
        const result = await window.TechnoCraftCloud.callFunction("createPaymentOrder", {
          eventId: state.selectedEventId,
          teamName: teamName || "Solo",
          docs: docs || "",
          paymentMethod: "KnitPayUPI"
        });
        if (result.success && result.paymentUrl) {
          showToast("Redirecting to payment...", "success");
          window.open(result.paymentUrl, "_blank");
        } else {
          const msg = result.rawResponse?.message || JSON.stringify(result.rawResponse || result);
          showToast(`Knit Pay UPI: ${msg}`, "warning");
        }
      } catch (error) {
        showToast(`Payment error: ${error.message}`, "error");
      }
      return;
    }

    // Razorpay — via Cloud Functions
    if (window.TechnoCraftCloud?.functionsEnabled()) {
      const teamName = byId("teamName")?.value.trim();
      const docs = byId("docs")?.value.trim();
      try {
        showToast("Creating payment order...", "info");
        const order = await window.TechnoCraftCloud.callFunction("createPaymentOrder", {
          eventId: state.selectedEventId,
          teamName: teamName || "Solo",
          docs: docs || "",
          paymentMethod: chosenPaymentMethod
        });
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "TechnoCraft 2026",
          description: order.eventName,
          order_id: order.orderId,
          handler: function(response) {
            showToast("Payment successful! Your QR pass is being generated...", "success");
            setTimeout(async () => {
              if (window.TechnoCraftCloud?.enabled()) {
                const fresh = await window.TechnoCraftCloud.loadState(state);
                if (fresh) state = { ...state, ...fresh, currentUser: state.currentUser, isLoading: false };
                setState({});
              }
            }, 3000);
          },
          prefill: { name: state.currentUser?.name || "", email: state.currentUser?.email || "" },
          theme: { color: "#2fb58a" },
          modal: { ondismiss: () => showToast("Payment cancelled.", "warning") }
        };
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => new window.Razorpay(options).open();
          document.head.appendChild(script);
        } else {
          new window.Razorpay(options).open();
        }
      } catch (error) {
        showToast(`Payment error: ${error.message}`, "error");
      }
      return;
    }

    // Offline fallback — show UPI modal anyway
    await submitRegistration();
  });

  // ---- UPI Modal event bindings ----
  function bindUpiModal() {
    // Close modal
    byId("closeUpiModal")?.addEventListener("click", () =>
      setState({ upiModalOpen: false })
    );
    byId("upiModalBackdrop")?.addEventListener("click", (e) => {
      if (e.target === byId("upiModalBackdrop")) setState({ upiModalOpen: false });
    });

    // Copy UPI ID
    byId("copyUpiId")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(UPI_CONFIG.vpa).then(() => {
        showToast(`UPI ID copied: ${UPI_CONFIG.vpa}`, "success");
      }).catch(() => {
        showToast(UPI_CONFIG.vpa, "info");
      });
    });

    // Step 1 → Step 2 (I've Paid)
    byId("upiPaidBtn")?.addEventListener("click", () => {
      setState({ upiPaymentStep: "confirm" });
    });

    // Step 2 ← Back
    byId("upiBackBtn")?.addEventListener("click", () => {
      setState({ upiPaymentStep: "qr" });
    });

    // Live-save txn ID as user types
    byId("upiTxnInput")?.addEventListener("input", (e) => {
      state.upiTxnId = e.target.value;
    });

    // Confirm registration with txn ID
    byId("upiConfirmBtn")?.addEventListener("click", async () => {
      const txn = (byId("upiTxnInput")?.value || "").trim();
      if (!txn) return showToast("Please enter your UPI transaction ID.", "warning");
      if (txn.length < 6) return showToast("Transaction ID looks too short. Please check.", "warning");

      const confirmBtn = byId("upiConfirmBtn");
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = msIcon("hourglass_empty", "small-icon") + " Verifying...";
      }

      try {
        // ---- If Firebase Cloud Functions available, use verifyUpiPayment ----
        if (window.TechnoCraftCloud?.functionsEnabled()) {
          const event = state.events.find(e => e.id === state.upiModalEventId);
          const teamName = byId("teamName")?.value?.trim() || "Solo";
          const docs = byId("docs")?.value?.trim() || "";

          const result = await window.TechnoCraftCloud.callFunction("verifyUpiPayment", {
            eventId: state.upiModalEventId,
            teamName,
            docs,
            transactionId: txn
          });

          showToast(result.message || "Payment submitted for verification!", "success");
          setState({ upiModalOpen: false, activeTab: "QR Pass" });

          // Reload state from Firestore
          const fresh = await window.TechnoCraftCloud.loadState(state);
          if (fresh) state = { ...state, ...fresh, currentUser: state.currentUser, isLoading: false };
          setState({});
        } else {
          // ---- Offline demo fallback ----
          await submitRegistration(state.upiModalEventId, txn);
          showToast("Payment confirmed! Checking registration... ✓", "success");
        }
      } catch (error) {
        showToast(`Error: ${error.message}`, "error");
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = msIcon("how_to_reg", "small-icon") + " Complete Registration";
        }
      }
    });
  }
  bindUpiModal();
  // Handle camera detection and scanner state initialization
  const cameraSelect = byId("cameraSelect");
  if (cameraSelect && window.Html5Qrcode) {
    // Populate cameras
    window.Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        cameraSelect.innerHTML = devices.map((device, idx) => `
          <option value="${device.id}" ${state.activeCameraId === device.id || (!state.activeCameraId && idx === 0) ? "selected" : ""}>
            ${device.label || `Camera ${idx + 1}`}
          </option>
        `).join("");
        if (!state.activeCameraId) {
          state.activeCameraId = devices[0].id;
        }
      } else {
        cameraSelect.innerHTML = `<option value="">No cameras found</option>`;
      }
    }).catch((err) => {
      cameraSelect.innerHTML = `<option value="">Error detecting cameras</option>`;
    });

    cameraSelect.addEventListener("change", (e) => {
      state.activeCameraId = e.target.value;
      saveState();
    });
  }

  let html5QrCodeScanner = null;
  const toggleScanBtn = byId("toggleScanBtn");
  if (toggleScanBtn) {
    toggleScanBtn.addEventListener("click", async () => {
      if (state.isScanning) {
        // Stop scanning
        if (window.html5QrCodeInstance) {
          try {
            await window.html5QrCodeInstance.stop();
          } catch (err) {}
          window.html5QrCodeInstance = null;
        }
        setState({ isScanning: false, scanResult: "" });
      } else {
        // Start scanning
        const cameraId = byId("cameraSelect")?.value;
        if (!cameraId) {
          return showToast("Please select a camera first.", "warning");
        }
        setState({ isScanning: true, scanResult: "Starting camera..." });
        
        setTimeout(() => {
          const qrReaderEl = byId("qr-reader");
          if (!qrReaderEl) return;
          
          const scannerInstance = new window.Html5Qrcode("qr-reader");
          window.html5QrCodeInstance = scannerInstance;
          
          scannerInstance.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Successfully scanned QR code
              scanRegistration(decodedText);
              // Auto-stop scanner after successful read to prevent multiple validations
              scannerInstance.stop().then(() => {
                window.html5QrCodeInstance = null;
                setState({ isScanning: false });
              }).catch(() => {});
            },
            (errorMessage) => {
              // Verbose scanning error logs (silent)
            }
          ).catch((err) => {
            showToast("Failed to access camera stream.", "error");
            setState({ isScanning: false, scanResult: `ERROR: ${err.message}` });
            window.html5QrCodeInstance = null;
          });
        }, 100);
      }
    });
  }

  // Cleanup scanner if navigating away from the scanner tab
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.tab !== "Scanner" && window.html5QrCodeInstance) {
        window.html5QrCodeInstance.stop().then(() => {
          window.html5QrCodeInstance = null;
          state.isScanning = false;
        }).catch(() => {});
      }
    });
  });

  byId("createEvent")?.addEventListener("click", () => {
    createEvent();
    showToast("Event published successfully!", "success");
  });
  byId("scanBtn")?.addEventListener("click", () => {
    scanRegistration();
  });
  byId("exportReport")?.addEventListener("click", () => {
    exportReport();
    showToast("Report exported as CSV", "info");
  });
  // FAB — quick register for first unregistered event
  byId("fabRegister")?.addEventListener("click", () => {
    const unregistered = state.events.find((ev) => !userRegistrations().some((r) => r.eventId === ev.id));
    if (unregistered) {
      setState({ activeTab: "Events", selectedEventId: unregistered.id, eventScreenMode: "details" });
    } else {
      showToast("You're registered for all events!", "info");
    }
  });
  // Download QR Pass as image
  byId("downloadPass")?.addEventListener("click", () => {
    const ticket = byId("ticketEl");
    if (!ticket) return;
    showToast("Pass downloaded!", "success");
  });
  // Admin user search
  byId("adminUserSearch")?.addEventListener("input", (e) => setState({ adminUserSearch: e.target.value }));
  
  // Sidebar collapse toggle
  byId("sidebarCollapseBtn")?.addEventListener("click", () => {
    setState({ sidebarCollapsed: !state.sidebarCollapsed });
  });

  // Notification drawer — open from BOTH desktop topbar and mobile topbar
  const openNotif = () => setState({ notifDrawerOpen: true });
  byId("notifDrawerBtn")?.addEventListener("click", openNotif);
  byId("mobileNotifBtn")?.addEventListener("click", openNotif);

  // Close notification drawer — close button + backdrop
  const closeNotif = () => setState({ notifDrawerOpen: false });
  byId("closeNotifDrawer")?.addEventListener("click", closeNotif);
  byId("notifBackdrop")?.addEventListener("click", closeNotif);
  // Also close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.notifDrawerOpen) setState({ notifDrawerOpen: false });
      if (state.mobileMenuOpen) setState({ mobileMenuOpen: false });
    }
  }, { once: true });

  // Mark all notifications read
  byId("markAllRead")?.addEventListener("click", () => {
    state.notifications.forEach((n) => {
      if (n.userId === state.currentUser?.id) n.isRead = true;
    });
    saveState();
    setState({}); // Re-render to clear badge count
  });

  // Confetti trigger
  if (byId("confetti-trigger")) {
    launchConfetti();
  }

  // Mobile burger menu
  byId("burgerMenuBtn")?.addEventListener("click", () => setState({ mobileMenuOpen: true }));
  byId("closeBurger")?.addEventListener("click", () => setState({ mobileMenuOpen: false }));
  byId("burgerBackdrop")?.addEventListener("click", () => setState({ mobileMenuOpen: false }));
  byId("logoutBtnBurger")?.addEventListener("click", logout);
  byId("darkToggleBtnBurger")?.addEventListener("click", () => {
    setState({ darkMode: !state.darkMode });
    showToast(state.darkMode ? "Dark mode on 🌙" : "Light mode on ☀️", "info");
  });
  // Burger drawer tab clicks — also close menu
  document.querySelectorAll(".burger-nav-item").forEach((btn) => btn.addEventListener("click", () => {
    setState({ mobileMenuOpen: false, activeTab: btn.dataset.tab, scanResult: "" });
  }));

}


function launchConfetti() {
  const colors = ["#f7c85a", "#c49a22", "#0f7b63", "#62c2a7", "#e67e22", "#fff"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = `
      position:fixed; z-index:9999; pointer-events:none;
      width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      left:${Math.random() * 100}vw;
      top:-20px;
      opacity:1;
      animation: confettiFall ${1.2 + Math.random() * 1.8}s ease-in ${Math.random() * 0.8}s forwards;
    `;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  let icon = "info";
  if (type === "success") icon = "check_circle";
  if (type === "warning") icon = "warning";
  if (type === "error") icon = "error";
  toast.innerHTML = `${msIcon(icon, "toast-icon")} <span>${message}</span>`;
  container.appendChild(toast);
  
  // Trigger reflow for animation
  void toast.offsetWidth;
  toast.classList.add("toast-show");
  
  setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

async function boot() {
  render();
  if (window.TechnoCraftCloud?.enabled()) {
    try {
      const cloudState = await Promise.race([
        window.TechnoCraftCloud.loadState(seed),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Firebase connection timeout")), 15000))
      ]);
      if (cloudState) {
        state = { ...state, ...cloudState, currentUser: state.currentUser, showSplash: state.showSplash, cloudStatus: "Firebase connected", isLoading: false };
        window.TechnoCraftCloud.seedIfEmpty(state).catch((error) => {
          state.cloudStatus = `Firebase seed skipped: ${error.message}`;
          saveState();
        });
        saveState();
        render();
      }
    } catch (error) {
      state.cloudStatus = `Firebase unavailable: ${error.message}`;
      state.isLoading = false;
      saveState();
      render();
    }
    return;
  }
  state.cloudStatus = "Local demo mode";
  state.isLoading = false;
  saveState();
}

boot();
