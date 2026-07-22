// ============================================================
// TechnoCraft 2026 — Admin Bootstrap Script
//
// PURPOSE:
//   Creates the FIRST Admin account securely.
//   Run this ONCE in the browser console on a trusted device.
//   After this, all subsequent Admins must be promoted by
//   an existing Admin from within the Admin dashboard.
//
// HOW TO USE:
//   1. Open your app in the browser (localhost:8000)
//   2. Open DevTools → Console
//   3. Paste this entire file's content and press Enter
//   4. Follow the prompts
//
// SECURITY NOTES:
//   - This script ONLY works if no Admin account exists yet.
//   - Delete or restrict this file after first use.
//   - Never commit admin credentials to source control.
// ============================================================

(async function bootstrapAdmin() {
  const firebase = window.firebase;
  const config = window.TECHNOCRAFT_FIREBASE_CONFIG;

  if (!firebase || !config) {
    console.error("❌ Firebase is not loaded. Open this in the app browser.");
    return;
  }

  // Check if Firebase app is already initialized
  let app;
  try {
    app = firebase.app();
  } catch (e) {
    app = firebase.initializeApp(config);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---- Check if an Admin already exists ----
  console.log("🔍 Checking for existing Admin accounts...");
  const existing = await db.collection("users")
    .where("role", "==", "Admin")
    .limit(1)
    .get();

  if (!existing.empty) {
    console.warn("⚠️  An Admin account already exists. Bootstrap is disabled for security.");
    console.warn("   To add more Admins, log in as the existing Admin and use the Admin dashboard.");
    return;
  }

  // ---- Collect Admin details ----
  const adminEmail = prompt("Enter Admin email address:");
  const adminName = prompt("Enter Admin full name:");
  const adminPassword = prompt("Enter a strong password (min 8 characters):");

  if (!adminEmail || !adminName || !adminPassword) {
    console.error("❌ Bootstrap cancelled — missing required fields.");
    return;
  }

  if (adminPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters.");
    return;
  }

  try {
    console.log("🔐 Creating Admin Firebase Auth account...");
    await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);

    const user = auth.currentUser;
    const adminProfile = {
      id: user.uid,
      firebaseUid: user.uid,
      email: user.email,
      name: adminName,
      role: "Admin",
      status: "active",
      department: "Administration",
      createdAt: new Date().toISOString(),
      bootstrapped: true
    };

    console.log("📝 Writing Admin profile to Firestore...");
    await db.collection("users").doc(user.uid).set(adminProfile);

    console.log("✅ Admin account created successfully!");
    console.log("   Email:", adminEmail);
    console.log("   UID:", user.uid);
    console.log("   Role: Admin");
    console.log("\n⚠️  IMPORTANT: Sign out now and log in through the normal app login screen.");
    console.log("   Delete or restrict this bootstrap script after use.");

    // Sign out so they must use the real login flow
    await auth.signOut();
    console.log("🔓 Signed out. Please use the app login screen to sign in as Admin.");

  } catch (error) {
    console.error("❌ Bootstrap failed:", error.message);
  }
})();
