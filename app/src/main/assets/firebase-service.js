// ============================================================
// TechnoCraft 2026 — Firebase Service Layer
// Phase A: Secure Role-Based Authentication
//
// SECURITY MODEL:
//   - Role is ALWAYS read from Firestore after login
//   - The role the user picks on screen is only used for
//     the initial Student self-registration
//   - Admin and Coordinator roles are NEVER self-assigned
// ============================================================

(function () {
  const hasFirebase = () => Boolean(window.firebase && window.TECHNOCRAFT_FIREBASE_ENABLED);
  let app = null;
  let auth = null;
  let db = null;
  let fns = null;

  function init() {
    if (!hasFirebase()) return false;
    if (!app) {
      app = firebase.initializeApp(window.TECHNOCRAFT_FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        console.warn("Firestore offline persistence failed:", err.code);
      });
      // Cloud Functions (requires firebase-functions SDK loaded in index.html)
      if (window.firebase.functions) {
        fns = firebase.functions();
      }
    }
    return true;
  }

  function clean(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // ---- Read the verified role from Firestore ----
  // This is always trusted over any client-side role claim.
  async function getVerifiedRole(uid) {
    try {
      const doc = await db.collection("users").doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        // Coordinators must be active to get Coordinator access
        if (data.role === "Coordinator" && data.status !== "active") {
          return "pending_coordinator";
        }
        return data.role || "Student";
      }
      return null; // New user, no profile yet
    } catch (e) {
      return null;
    }
  }

  // ---- Sign in only (no auto-create for login screen) ----
  async function signIn(email, password) {
    if (!init()) return { mode: "local" };
    await auth.signInWithEmailAndPassword(email, password);
    const firebaseUser = auth.currentUser;
    const verifiedRole = await getVerifiedRole(firebaseUser.uid);
    if (!verifiedRole) {
      await auth.signOut();
      throw new Error("Account exists in Auth but has no profile. Contact Admin.");
    }
    const doc = await db.collection("users").doc(firebaseUser.uid).get();
    const cloudUser = { id: firebaseUser.uid, firebaseUid: firebaseUser.uid, ...doc.data() };
    return { mode: "firebase", user: cloudUser, verifiedRole };
  }

  // ---- Register a new Student account ----
  // Role is ALWAYS hardcoded to "Student" here — no exceptions.
  async function registerStudent(email, password, profileData) {
    if (!init()) return { mode: "local" };
    await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = auth.currentUser;
    const studentProfile = {
      ...profileData,
      id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      role: "Student",    // HARDCODED — never from client input
      status: "active",
      createdAt: new Date().toISOString()
    };
    await db.collection("users").doc(firebaseUser.uid).set(clean(studentProfile));
    return { mode: "firebase", user: studentProfile, verifiedRole: "Student" };
  }

  // ---- Request a Coordinator account (requires Admin approval) ----
  async function requestCoordinatorAccount(email, password, profileData) {
    if (!init()) return { mode: "local" };
    await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = auth.currentUser;
    const coordProfile = {
      ...profileData,
      id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      role: "Coordinator",
      status: "pending",    // Must be activated by Admin
      createdAt: new Date().toISOString()
    };
    await db.collection("users").doc(firebaseUser.uid).set(clean(coordProfile));
    // Sign out immediately — they cannot access the app until approved
    await auth.signOut();
    return { mode: "firebase", pending: true, message: "Your Coordinator account request has been submitted. Please wait for Admin approval." };
  }

  async function signOut() {
    if (!init()) return;
    await auth.signOut();
  }

  async function upsert(collection, id, data) {
    if (!init()) return;
    await db.collection(collection).doc(id).set(clean(data), { merge: true });
  }

  async function removeCollectionSnapshot(collection) {
    if (!init()) return [];
    const snapshot = await db.collection(collection).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async function loadState(seed) {
    if (!init()) return null;
    const [users, events, registrations, attendance, notifications, certificates] = await Promise.all([
      removeCollectionSnapshot("users"),
      removeCollectionSnapshot("events"),
      removeCollectionSnapshot("registrations"),
      removeCollectionSnapshot("attendance"),
      removeCollectionSnapshot("notifications"),
      removeCollectionSnapshot("certificates")
    ]);
    return {
      ...seed,
      users: users.length ? users : seed.users,
      events: events.length ? events : seed.events,
      registrations: registrations.length ? registrations : seed.registrations,
      attendance: attendance.length ? attendance : seed.attendance,
      notifications: notifications.length ? notifications : seed.notifications,
      certificates: certificates.length ? certificates : []
    };
  }

  async function seedIfEmpty(state) {
    if (!init()) return;
    const events = await db.collection("events").limit(1).get();
    if (!events.empty) return;
    await Promise.all([
      ...state.users.map((item) => upsert("users", item.id, item)),
      ...state.events.map((item) => upsert("events", item.id, item)),
      ...state.registrations.map((item) => upsert("registrations", item.id, item)),
      ...state.notifications.map((item) => upsert("notifications", item.id, item))
    ]);
  }

  // ---- Call a Cloud Function by name ----
  // Falls back gracefully if Functions SDK is not loaded.
  async function callFunction(name, data = {}) {
    if (!init() || !fns) {
      throw new Error("Cloud Functions are not available in offline mode.");
    }
    const fn = fns.httpsCallable(name);
    const result = await fn(data);
    return result.data;
  }

  // ---- Check if Cloud Functions are available ----
  function functionsEnabled() {
    return init() && Boolean(fns);
  }

  window.TechnoCraftCloud = {
    enabled: hasFirebase,
    functionsEnabled,
    init,
    signIn,
    registerStudent,
    requestCoordinatorAccount,
    signOut,
    upsert,
    loadState,
    seedIfEmpty,
    getVerifiedRole,
    callFunction
  };
})();
