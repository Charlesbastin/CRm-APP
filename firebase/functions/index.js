// ============================================================
// TechnoCraft 2026 — Firebase Cloud Functions
// Phase B + C: Secure Backend Logic + Payment Integration
//
// FUNCTIONS:
//   1. processRegistration   — Atomic seat booking with transaction
//   2. generateQRPass        — Signed QR token after approval
//   3. approveCoordinator    — Admin-only coordinator activation
//   4. validateQRScan        — Server-side QR pass verification
//   5. createPaymentOrder    — Razorpay order creation (server-side)
//   6. verifyPaymentWebhook  — Razorpay webhook signature verification
//   7. verifyUpiPayment      — UPI QR manual txn ID submission
// ============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");

// ---- Razorpay client (Key Secret from Firebase Secret Manager) ----
// Set secrets with: firebase functions:secrets:set RAZORPAY_KEY_SECRET
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay Key Secret is not configured. Set RAZORPAY_KEY_SECRET in Firebase Secrets.");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

admin.initializeApp();
const db = admin.firestore();

// ---- Internal secret for HMAC signing ----
// In production, move this to Firebase Secret Manager:
// const { defineSecret } = require("firebase-functions/params");
// const QR_SECRET = defineSecret("QR_SIGNING_SECRET");
const QR_SECRET = functions.config().technocraft?.qr_secret || "tc2026-qr-secret-key-change-in-prod";

// ============================================================
// HELPER: Verify the caller has a specific role in Firestore
// ============================================================
async function verifyRole(uid, allowedRoles) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) throw new Error("User profile not found.");
  const role = userDoc.data().role;
  const status = userDoc.data().status;
  if (!allowedRoles.includes(role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(" or ")}.`);
  }
  if (role === "Coordinator" && status !== "active") {
    throw new Error("Your Coordinator account is pending Admin approval.");
  }
  return { role, ...userDoc.data() };
}

// ============================================================
// HELPER: Create a signed HMAC QR token
// ============================================================
function createSignedToken(registrationId, eventId, studentId) {
  const payload = `${registrationId}|${eventId}|${studentId}|${Date.now()}`;
  const token = uuidv4();
  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${token}|${payload}`)
    .digest("hex");
  return { token, signature, payload };
}

// ============================================================
// HELPER: Verify a QR token's HMAC signature
// ============================================================
function verifySignature(token, payload, signature) {
  const expected = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${token}|${payload}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ============================================================
// FUNCTION 1: processRegistration
//
// Called when a student taps "Register" in the app.
// Uses a Firestore transaction to atomically:
//   1. Check seat availability
//   2. Prevent duplicate registrations
//   3. Create registration as "Pending"
//   4. Add to waiting list if full
//   5. Notify the event coordinator
// ============================================================
exports.processRegistration = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { eventId, teamName, docs, paymentMethod } = data;

  if (!eventId) throw new functions.https.HttpsError("invalid-argument", "Event ID is required.");

  // Verify caller is a Student
  const caller = await verifyRole(uid, ["Student"]);

  const registrationId = `reg-${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    const result = await db.runTransaction(async (tx) => {
      // Read event inside transaction
      const eventRef = db.collection("events").doc(eventId);
      const eventDoc = await tx.get(eventRef);
      if (!eventDoc.exists) throw new Error("Event not found.");
      const event = eventDoc.data();

      // Check registration deadline
      if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
        throw new Error("Registration deadline has passed.");
      }

      // Check for duplicate registration
      const dupCheck = await db.collection("registrations")
        .where("eventId", "==", eventId)
        .where("studentId", "==", uid)
        .limit(1)
        .get();
      if (!dupCheck.empty) throw new Error("You are already registered for this event.");

      // Count current registrations (approved + pending)
      const countSnap = await db.collection("registrations")
        .where("eventId", "==", eventId)
        .where("status", "in", ["Approved", "Pending"])
        .get();
      const currentCount = countSnap.size;

      const isFull = currentCount >= (event.capacity || 999);
      const isFree = !event.entryFee || Number(event.entryFee) === 0;

      if (isFull) {
        // Add to waiting list
        const waitlistId = `wait-${uuidv4()}`;
        const waitRef = db.collection("registrations").doc(waitlistId);
        tx.set(waitRef, {
          id: waitlistId,
          eventId,
          studentId: uid,
          studentName: caller.name,
          studentEmail: caller.email,
          status: "Waitlisted",
          paymentMethod: paymentMethod || "Pending",
          paymentStatus: "Not Required",
          transactionId: "",
          teamName: teamName || "Solo",
          docs: docs || "",
          createdAt: now
        });
        return { status: "waitlisted", message: "Event is full. You have been added to the waiting list." };
      }

      // Create registration
      const regRef = db.collection("registrations").doc(registrationId);
      const status = isFree ? "Approved" : "Pending";
      const txnId = isFree
        ? `FREE-${Date.now()}`
        : (data.transactionId ? data.transactionId.trim() : "");
      tx.set(regRef, {
        id: registrationId,
        eventId,
        studentId: uid,
        studentName: caller.name,
        studentEmail: caller.email,
        status,
        paymentMethod: isFree ? "Free" : (paymentMethod || "UPI"),
        paymentStatus: isFree ? "Paid" : (txnId ? "Submitted" : "Unpaid"),
        transactionId: txnId || "",
        teamName: teamName || "Solo",
        docs: docs || "",
        createdAt: now
      });

      // Notify coordinator
      const notifRef = db.collection("notifications").doc(`notif-${uuidv4()}`);
      tx.set(notifRef, {
        id: notifRef.id,
        userId: event.createdBy,
        title: `New registration: ${event.name}`,
        message: `${caller.name} registered for your event.`,
        timestamp: now,
        isRead: false
      });

      // If free, auto-generate QR pass immediately
      if (isFree) {
        return { status: "approved", registrationId, generatePass: true };
      }
      return { status: "pending", registrationId, generatePass: false };
    });

    // After transaction — generate QR if approved
    if (result.generatePass) {
      const { token, signature, payload } = createSignedToken(registrationId, eventId, uid);
      await db.collection("passes").doc(registrationId).set({
        id: registrationId,
        registrationId,
        eventId,
        studentId: uid,
        token,
        signature,
        payload,
        isScanned: false,
        createdAt: now,
        expiresAt: null // set to event date in production
      });
    }

    return { success: true, ...result };
  } catch (err) {
    throw new functions.https.HttpsError("aborted", err.message);
  }
});

// ============================================================
// FUNCTION 2: generateQRPass
//
// Called after Admin/Coordinator approves a registration.
// Creates a cryptographically signed QR pass in /passes.
// The QR code shown in the app is this signed token.
// A forged code will fail validateQRScan.
// ============================================================
exports.generateQRPass = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { registrationId } = data;
  if (!registrationId) throw new functions.https.HttpsError("invalid-argument", "Registration ID required.");

  // Verify caller is Staff or Admin
  await verifyRole(uid, ["Coordinator", "Admin"]);

  const regDoc = await db.collection("registrations").doc(registrationId).get();
  if (!regDoc.exists) throw new functions.https.HttpsError("not-found", "Registration not found.");

  const reg = regDoc.data();
  if (reg.status !== "Approved") {
    throw new functions.https.HttpsError("failed-precondition", "Registration must be Approved before generating a pass.");
  }

  // Check pass doesn't already exist
  const existing = await db.collection("passes").doc(registrationId).get();
  if (existing.exists) return { success: true, alreadyExists: true, passId: registrationId };

  const { token, signature, payload } = createSignedToken(registrationId, reg.eventId, reg.studentId);
  const now = new Date().toISOString();

  await db.collection("passes").doc(registrationId).set({
    id: registrationId,
    registrationId,
    eventId: reg.eventId,
    studentId: reg.studentId,
    studentName: reg.studentName,
    token,
    signature,
    payload,
    isScanned: false,
    createdAt: now,
    expiresAt: null
  });

  // Notify student
  await db.collection("notifications").doc(`notif-${uuidv4()}`).set({
    userId: reg.studentId,
    title: "Your QR pass is ready!",
    message: "Your registration has been approved. Open the QR Pass tab to view it.",
    timestamp: now,
    isRead: false
  });

  // Write audit log
  await db.collection("auditLogs").add({
    action: "GENERATE_QR_PASS",
    performedBy: uid,
    affectedRecord: registrationId,
    timestamp: now
  });

  return { success: true, passId: registrationId };
});

// ============================================================
// FUNCTION 3: approveCoordinator
//
// Called by Admin to activate a pending Coordinator account.
// Verifies caller is Admin, then sets status to "active".
// ============================================================
exports.approveCoordinator = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { coordinatorId } = data;
  if (!coordinatorId) throw new functions.https.HttpsError("invalid-argument", "Coordinator ID required.");

  // Only Admin can approve
  await verifyRole(uid, ["Admin"]);

  const coordDoc = await db.collection("users").doc(coordinatorId).get();
  if (!coordDoc.exists) throw new functions.https.HttpsError("not-found", "Coordinator account not found.");

  const coord = coordDoc.data();
  if (coord.role !== "Coordinator") {
    throw new functions.https.HttpsError("failed-precondition", "This account is not a Coordinator.");
  }
  if (coord.status === "active") {
    return { success: true, message: "Account is already active." };
  }

  const now = new Date().toISOString();
  await db.collection("users").doc(coordinatorId).update({ status: "active", approvedBy: uid, approvedAt: now });

  // Notify coordinator
  await db.collection("notifications").doc(`notif-${uuidv4()}`).set({
    userId: coordinatorId,
    title: "Coordinator account approved!",
    message: "Your TechnoCraft Coordinator account is now active. You can sign in and start creating events.",
    timestamp: now,
    isRead: false
  });

  // Audit log
  await db.collection("auditLogs").add({
    action: "APPROVE_COORDINATOR",
    performedBy: uid,
    affectedRecord: coordinatorId,
    timestamp: now
  });

  return { success: true, message: `Coordinator ${coord.name} approved successfully.` };
});

// ============================================================
// FUNCTION 4: validateQRScan
//
// Called by Coordinator when scanning a QR pass with camera.
// Verifies:
//   1. Token HMAC signature is valid (cannot be forged)
//   2. Event ID matches
//   3. Pass is not already scanned
//   4. Pass is not expired or cancelled
// Records attendance and marks pass as scanned.
// ============================================================
exports.validateQRScan = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { qrToken, qrSignature, qrPayload, eventId } = data;

  if (!qrToken || !qrSignature || !qrPayload || !eventId) {
    throw new functions.https.HttpsError("invalid-argument", "QR token data is incomplete.");
  }

  // Verify caller is Staff
  await verifyRole(uid, ["Coordinator", "Admin"]);

  // Verify HMAC signature — if this fails, the QR code is forged
  let signatureValid;
  try {
    signatureValid = verifySignature(qrToken, qrPayload, qrSignature);
  } catch (e) {
    throw new functions.https.HttpsError("invalid-argument", "QR signature verification failed. Invalid pass.");
  }
  if (!signatureValid) {
    throw new functions.https.HttpsError("permission-denied", "❌ Invalid QR pass. This pass has been tampered with.");
  }

  // Find the pass by token
  const passSnap = await db.collection("passes").where("token", "==", qrToken).limit(1).get();
  if (passSnap.empty) {
    throw new functions.https.HttpsError("not-found", "❌ QR pass not found in system.");
  }

  const passDoc = passSnap.docs[0];
  const pass = passDoc.data();

  // Check event matches
  if (pass.eventId !== eventId) {
    throw new functions.https.HttpsError("failed-precondition", "❌ This pass is for a different event.");
  }

  // Check if already scanned
  if (pass.isScanned) {
    throw new functions.https.HttpsError("already-exists", `❌ This pass was already scanned at ${pass.scannedAt}.`);
  }

  // Check registration is still Approved
  const regDoc = await db.collection("registrations").doc(pass.registrationId).get();
  if (!regDoc.exists || regDoc.data().status !== "Approved") {
    throw new functions.https.HttpsError("failed-precondition", "❌ Registration is no longer approved.");
  }

  const now = new Date().toISOString();

  // Mark pass as scanned (immutable after this)
  await passDoc.ref.update({ isScanned: true, scannedAt: now, scannedBy: uid });

  // Record attendance
  await db.collection("attendance").add({
    studentId: pass.studentId,
    studentName: pass.studentName,
    eventId: pass.eventId,
    registrationId: pass.registrationId,
    scannedBy: uid,
    scannedAt: now
  });

  // Audit log
  await db.collection("auditLogs").add({
    action: "QR_SCAN_VALIDATED",
    performedBy: uid,
    affectedRecord: pass.registrationId,
    studentId: pass.studentId,
    eventId: pass.eventId,
    timestamp: now
  });

  return {
    success: true,
    studentName: pass.studentName,
    eventId: pass.eventId,
    scannedAt: now,
    message: `✅ Entry approved for ${pass.studentName}`
  };
});

// ============================================================
// FUNCTION 5: createPaymentOrder
//
// Called when student taps "Pay & Register".
// Creates a Razorpay order SERVER-SIDE using the secret key.
// Returns the order_id and key_id to the app.
// The app then launches the Razorpay payment sheet.
// The app NEVER sees the secret key.
// ============================================================
exports.createPaymentOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { eventId, teamName, docs, paymentMethod } = data;
  if (!eventId) throw new functions.https.HttpsError("invalid-argument", "Event ID is required.");

  // Verify caller is a Student
  await verifyRole(uid, ["Student"]);

  // Get event details
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) throw new functions.https.HttpsError("not-found", "Event not found.");
  const event = eventDoc.data();

  const fee = Number(event.entryFee || 0);
  if (fee <= 0) throw new functions.https.HttpsError("failed-precondition", "This event has no entry fee. Use free registration.");

  // Check for duplicate registration
  const dupCheck = await db.collection("registrations")
    .where("eventId", "==", eventId)
    .where("studentId", "==", uid)
    .limit(1).get();
  if (!dupCheck.empty) throw new functions.https.HttpsError("already-exists", "You are already registered for this event.");

  // Handle Knit Pay UPI RapidAPI method
  if (paymentMethod === "KnitPayUPI") {
    try {
      const response = await fetch("https://knit-pay-upi.p.rapidapi.com/payments/upi/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "knit-pay-upi.p.rapidapi.com",
          "x-rapidapi-key": "168dd9aa6cmshdfa45f59d185f2ep12f348jsn7e09af77374a"
        },
        body: JSON.stringify({
          mode: "live",
          gateway: "paytm",
          payment_method: "upi",
          source: "rapidapi-test",
          amount: fee.toString(),
          currency: "INR",
          knitpay_version: "0.0.0.0",
          website_url: "https://rapidapi.com",
          data: `tc-${eventId}-${uid.slice(0, 8)}`
        })
      });

      const rawText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(rawText);
      } catch (e) {
        resJson = { message: rawText };
      }

      if (!response.ok || (resJson && resJson.message && resJson.message.includes("not subscribed"))) {
        return {
          success: false,
          error: resJson.message || "RapidAPI subscription error",
          rawResponse: resJson
        };
      }

      // Store pending payment record in Firestore
      const orderId = `knit-${uuidv4().slice(0, 8)}`;
      await db.collection("payments").doc(orderId).set({
        orderId,
        eventId,
        studentId: uid,
        amount: fee * 100,
        currency: "INR",
        status: "created",
        teamName: teamName || "Solo",
        docs: docs || "",
        paymentMethod: "KnitPayUPI",
        createdAt: new Date().toISOString(),
        knitPayResponse: resJson
      });

      return {
        success: true,
        orderId,
        paymentUrl: resJson.payment_url || resJson.upi_uri || null,
        rawResponse: resJson
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  // Create Razorpay order (amount is in paise — multiply by 100)
  const razorpay = getRazorpayClient();
  const amountInPaise = Math.round(fee * 115); // fee + 15% gateway/tax
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `tc-${eventId}-${uid.slice(0, 8)}`,
    notes: {
      eventId,
      studentId: uid,
      teamName: teamName || "Solo",
      docs: docs || ""
    }
  });

  const now = new Date().toISOString();

  // Store pending payment record in Firestore
  await db.collection("payments").doc(order.id).set({
    orderId: order.id,
    eventId,
    studentId: uid,
    amount: amountInPaise,
    currency: "INR",
    status: "created",
    teamName: teamName || "Solo",
    docs: docs || "",
    paymentMethod: paymentMethod || "UPI",
    createdAt: now
  });

  // Return order details + public key to app
  return {
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    eventName: event.name,
    studentId: uid
  };
});

// ============================================================
// FUNCTION 6: verifyPaymentWebhook
//
// Called by Razorpay after payment completes (webhook).
// Verifies HMAC-SHA256 signature — this is the ONLY way
// a payment should ever be marked as "Paid".
//
// Setup: In Razorpay Dashboard → Webhooks → add this URL:
//   https://<region>-tech-dad30.cloudfunctions.net/verifyPaymentWebhook
// ============================================================
exports.verifyPaymentWebhook = functions.https.onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured.");
    return res.status(500).send("Server misconfigured.");
  }

  // Verify the webhook signature
  const receivedSignature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (receivedSignature !== expectedSignature) {
    console.warn("❌ Invalid Razorpay webhook signature. Possible attack.");
    await db.collection("auditLogs").add({
      action: "WEBHOOK_SIGNATURE_FAILED",
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    return res.status(400).send("Invalid signature.");
  }

  const event = req.body.event;
  const payload = req.body.payload;

  // Handle payment success
  if (event === "payment.captured") {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const now = new Date().toISOString();

    // Get our stored payment record
    const paymentDoc = await db.collection("payments").doc(orderId).get();
    if (!paymentDoc.exists) {
      console.warn(`No payment record found for order: ${orderId}`);
      return res.status(200).send("OK"); // Return 200 to stop retries
    }

    const paymentData = paymentDoc.data();
    const { eventId, studentId, teamName, docs, paymentMethod } = paymentData;

    // Update payment as captured
    await paymentDoc.ref.update({
      status: "paid",
      paymentId,
      paidAt: now
    });

    // Get student info
    const userDoc = await db.collection("users").doc(studentId).get();
    const student = userDoc.data();

    // Create confirmed registration
    const registrationId = `reg-${uuidv4()}`;
    await db.collection("registrations").doc(registrationId).set({
      id: registrationId,
      eventId,
      studentId,
      studentName: student?.name || "Student",
      studentEmail: student?.email || "",
      status: "Approved",
      paymentMethod: paymentMethod || "UPI",
      paymentStatus: "Paid",
      transactionId: paymentId,
      orderId,
      teamName: teamName || "Solo",
      docs: docs || "",
      createdAt: now
    });

    // Auto-generate QR pass
    const { token, signature: sig, payload: pl } = createSignedToken(registrationId, eventId, studentId);
    await db.collection("passes").doc(registrationId).set({
      id: registrationId,
      registrationId,
      eventId,
      studentId,
      studentName: student?.name || "Student",
      token,
      signature: sig,
      payload: pl,
      isScanned: false,
      createdAt: now
    });

    // Notify student
    await db.collection("notifications").add({
      userId: studentId,
      title: "Payment confirmed! QR pass ready.",
      message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} was verified. Your QR pass is ready in the app.`,
      timestamp: now,
      isRead: false
    });

    // Audit log
    await db.collection("auditLogs").add({
      action: "PAYMENT_VERIFIED",
      orderId,
      paymentId,
      studentId,
      eventId,
      amount: payment.amount,
      timestamp: now
    });

    console.log(`✅ Payment verified: ${paymentId} for student ${studentId}`);
  }

  // Always return 200 to Razorpay to acknowledge receipt
  return res.status(200).json({ received: true });
});

// ============================================================
// TRIGGER FUNCTION: generateCertificate
//
// Automatically triggers when a student is checked in.
// Generates a verified PDF, uploads it to storage, and
// creates a certificate metadata record in /certificates.
// ============================================================
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

exports.generateCertificate = functions.firestore
  .document("attendance/{attendanceId}")
  .onCreate(async (snapshot, context) => {
    const attendance = snapshot.data();
    const { studentId, eventId, studentName } = attendance;

    try {
      // Get event details
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) throw new Error("Event not found.");
      const event = eventDoc.data();

      // Check if a certificate already exists
      const certRef = db.collection("certificates").doc(`${studentId}_${eventId}`);
      const certCheck = await certRef.get();
      if (certCheck.exists) return null;

      const certNumber = `CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();

      // Create new PDF Document
      const pdfDoc = await PDFDocument.create();
      // Letter page in landscape mode
      const page = pdfDoc.addPage([792, 612]);
      const { width, height } = page.getSize();

      const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Draw premium borders
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.09, 0.48, 0.39), // Emerald
        borderWidth: 3
      });

      page.drawRectangle({
        x: 26,
        y: 26,
        width: width - 52,
        height: height - 52,
        borderColor: rgb(0.77, 0.6, 0.14), // Gold
        borderWidth: 1.5
      });

      // Decorative corner accents
      const drawCorner = (cx, cy) => {
        page.drawRectangle({
          x: cx,
          y: cy,
          width: 30,
          height: 30,
          color: rgb(0.77, 0.6, 0.14)
        });
      };
      drawCorner(20, 20);
      drawCorner(width - 50, 20);
      drawCorner(20, height - 50);
      drawCorner(width - 50, height - 50);

      // Header Text
      page.drawText("TECHNOCRAFT 2026", {
        x: width / 2 - 120,
        y: height - 100,
        size: 24,
        font: fontTitle,
        color: rgb(0.09, 0.48, 0.39)
      });

      page.drawText("CAMPUS EVENT PORTAL", {
        x: width / 2 - 75,
        y: height - 120,
        size: 10,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Main content
      page.drawText("CERTIFICATE OF PARTICIPATION", {
        x: width / 2 - 180,
        y: height - 220,
        size: 20,
        font: fontTitle,
        color: rgb(0.77, 0.6, 0.14)
      });

      page.drawText("This certificate is proudly presented to", {
        x: width / 2 - 110,
        y: height - 260,
        size: 12,
        font: fontItalic,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Draw Student Name centered
      const nameWidth = fontTitle.widthOfTextAtSize(studentName, 26);
      page.drawText(studentName, {
        x: width / 2 - nameWidth / 2,
        y: height - 310,
        size: 26,
        font: fontTitle,
        color: rgb(0.09, 0.48, 0.39)
      });

      // Underline student name
      page.drawLine({
        start: { x: width / 2 - 150, y: height - 320 },
        end: { x: width / 2 + 150, y: height - 320 },
        thickness: 1,
        color: rgb(0.77, 0.6, 0.14)
      });

      const message = `for actively participating and successfully completing the event`;
      page.drawText(message, {
        x: width / 2 - fontText.widthOfTextAtSize(message, 12) / 2,
        y: height - 350,
        size: 12,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Event Name centered
      const eventNameText = `"${event.name}"`;
      const eventWidth = fontTitle.widthOfTextAtSize(eventNameText, 18);
      page.drawText(eventNameText, {
        x: width / 2 - eventWidth / 2,
        y: height - 390,
        size: 18,
        font: fontTitle,
        color: rgb(0.09, 0.48, 0.39)
      });

      const dateText = `Held on ${event.date}, 2026 at ${event.venue}`;
      page.drawText(dateText, {
        x: width / 2 - fontText.widthOfTextAtSize(dateText, 11) / 2,
        y: height - 420,
        size: 11,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Signatures
      page.drawLine({
        start: { x: 80, y: 100 },
        end: { x: 260, y: 100 },
        thickness: 1,
        color: rgb(0.38, 0.44, 0.41)
      });
      page.drawText("Event Coordinator", {
        x: 120,
        y: 80,
        size: 10,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      page.drawLine({
        start: { x: width - 260, y: 100 },
        end: { x: width - 80, y: 100 },
        thickness: 1,
        color: rgb(0.38, 0.44, 0.41)
      });
      page.drawText("Administration Head", {
        x: width - 210,
        y: 80,
        size: 10,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Certificate Number & Verification footer
      page.drawText(`Certificate ID: ${certNumber}`, {
        x: 40,
        y: 40,
        size: 8,
        font: fontText,
        color: rgb(0.38, 0.44, 0.41)
      });

      page.drawText("Verify authenticity online at: tech-dad30.web.app/verify.html", {
        x: width - 330,
        y: 40,
        size: 8,
        font: fontItalic,
        color: rgb(0.38, 0.44, 0.41)
      });

      // Serialize PDF to Bytes
      const pdfBytes = await pdfDoc.save();

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const storagePath = `certificates/${studentId}/${eventId}.pdf`;
      const file = bucket.file(storagePath);

      await file.save(Buffer.from(pdfBytes), {
        metadata: {
          contentType: "application/pdf"
        }
      });

      // Make the file publicly readable to get download link
      await file.makePublic();
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // Write certificate profile metadata record to firestore
      await certRef.set({
        id: `${studentId}_${eventId}`,
        studentId,
        studentName,
        eventId,
        eventName: event.name,
        certNumber,
        pdfUrl: downloadUrl,
        issuedAt: now
      });

      // Send student notification
      await db.collection("notifications").add({
        userId: studentId,
        title: "Certificate Issued!",
        message: `Your participation certificate for ${event.name} has been generated. Download it from your Profile.`,
        timestamp: now,
        isRead: false
      });

      // Audit Log
      await db.collection("auditLogs").add({
        action: "CERTIFICATE_GENERATED",
        certNumber,
        studentId,
        eventId,
        timestamp: now
      });

    } catch (error) {
      console.error("Certificate generation failed:", error);
    }
    return null;
  });
// ============================================================
// FUNCTION 7: verifyUpiPayment
//
// Called when a student scans the in-app UPI QR and submits
// their UPI transaction ID to confirm payment.
// Flow:
//   1. Validates student + event
//   2. Prevents duplicate registrations
//   3. Creates a "Pending" registration with the UPI txn ID
//   4. Notifies coordinator for manual verification
//   5. Responds with registration ID for QR pass generation
//
// NOTE: For full automation, Admins can verify txn ID via
// their UPI dashboard and approve the registration.
// ============================================================
exports.verifyUpiPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");

  const uid = context.auth.uid;
  const { eventId, teamName, docs, transactionId } = data;

  if (!eventId) throw new functions.https.HttpsError("invalid-argument", "Event ID is required.");
  if (!transactionId || transactionId.trim().length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "A valid UPI Transaction ID is required.");
  }

  // Verify caller is a Student
  const caller = await verifyRole(uid, ["Student"]);

  // Get event
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) throw new functions.https.HttpsError("not-found", "Event not found.");
  const event = eventDoc.data();

  const fee = Number(event.entryFee || 0);
  if (fee <= 0) throw new functions.https.HttpsError("failed-precondition", "This event has no entry fee.");

  // Check for duplicate registration
  const dupCheck = await db.collection("registrations")
    .where("eventId", "==", eventId)
    .where("studentId", "==", uid)
    .limit(1).get();
  if (!dupCheck.empty) throw new functions.https.HttpsError("already-exists", "You are already registered for this event.");

  // Check if same transaction ID already used (fraud prevention)
  const txnCheck = await db.collection("registrations")
    .where("transactionId", "==", transactionId.trim())
    .limit(1).get();
  if (!txnCheck.empty) {
    throw new functions.https.HttpsError("already-exists", "This Transaction ID has already been used for a registration.");
  }

  // Check seat availability
  const countSnap = await db.collection("registrations")
    .where("eventId", "==", eventId)
    .where("status", "in", ["Approved", "Pending"])
    .get();
  if (countSnap.size >= (event.capacity || 999)) {
    throw new functions.https.HttpsError("resource-exhausted", "Event is full. No seats available.");
  }

  const now = new Date().toISOString();
  const registrationId = `reg-${uuidv4()}`;
  const gateway = fee * 0.15;
  const total = fee + gateway;

  // Create pending registration with UPI txn ID
  await db.collection("registrations").doc(registrationId).set({
    id: registrationId,
    eventId,
    studentId: uid,
    studentName: caller.name,
    studentEmail: caller.email,
    status: "Pending",        // Coordinator must verify UPI payment & approve
    paymentMethod: "UPI",
    paymentStatus: "Submitted",
    transactionId: transactionId.trim(),
    amountExpected: total,
    teamName: teamName || "Solo",
    docs: docs || "",
    createdAt: now
  });

  // Store UPI payment record
  const upiPaymentId = `upi-${uuidv4().slice(0, 8)}`;
  await db.collection("payments").doc(upiPaymentId).set({
    id: upiPaymentId,
    registrationId,
    eventId,
    studentId: uid,
    studentName: caller.name,
    transactionId: transactionId.trim(),
    amountExpected: total,
    currency: "INR",
    paymentMethod: "UPI",
    status: "pending_verification",
    createdAt: now
  });

  // Notify coordinator to verify UPI payment
  await db.collection("notifications").doc(`notif-${uuidv4()}`).set({
    id: `notif-${uuidv4()}`,
    userId: event.createdBy,
    title: `UPI Payment Submitted — ${event.name}`,
    message: `${caller.name} submitted UPI Txn ID: ${transactionId.trim()}. Please verify in your UPI app and approve.`,
    timestamp: now,
    isRead: false
  });

  // Notify student
  await db.collection("notifications").doc(`notif-${uuidv4()}`).set({
    id: `notif-${uuidv4()}`,
    userId: uid,
    title: `Registration submitted for ${event.name}`,
    message: `Your UPI payment (Txn: ${transactionId.trim()}) is under verification. You'll be notified once approved.`,
    timestamp: now,
    isRead: false
  });

  // Audit log
  await db.collection("auditLogs").add({
    action: "UPI_PAYMENT_SUBMITTED",
    registrationId,
    studentId: uid,
    eventId,
    transactionId: transactionId.trim(),
    timestamp: now
  });

  return {
    success: true,
    registrationId,
    message: "Payment submitted for verification. You will be notified once the coordinator approves."
  };
});

