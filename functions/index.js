const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { getAuth } = require("firebase-admin/auth");

admin.initializeApp();

// Nodemailer setup for email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

// Function to set custom claims for users (outfitter, guide, hunter)
exports.setUserRole = functions.https.onCall(async (data, context) => {
  const { uid, role, outfitterId } = data;

  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role, outfitterId });
    // Force refresh to pick up new claims
    await admin.auth().revokeRefreshTokens(uid);
    return { message: `Success! Role ${role} assigned to user.` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Callable function to add a hunter (single doc creation using UID)
exports.addHunter = functions.https.onCall(async (data, context) => {
  // Ensure only outfitters can call this function
  if (!context.auth || context.auth.token.role !== 'outfitter') {
    throw new functions.https.HttpsError('permission-denied', 'Only outfitters can add hunters.');
  }

  const { hunterName, hunterEmail, hunterPhone } = data;
  const outfitterId = context.auth.token.outfitterId;

  try {
    const auth = getAuth();

    // 1. Create the user in Firebase Authentication and get the UID
    const userRecord = await auth.createUser({
      email: hunterEmail,
      emailVerified: false,
      displayName: hunterName,
      password: 'TemporaryPassword123!', // Temporary password for reset flow
      disabled: false,
    });

    const uid = userRecord.uid;
    console.log(`Created new user for hunter: ${uid}`);

    // 2. Set custom claims for the new user
    await auth.setCustomUserClaims(uid, { role: 'hunter', outfitterId });

    // 3. Generate a password reset link for the hunter to set their password
    const passwordResetLink = await auth.generatePasswordResetLink(hunterEmail);

    // 4. Create the hunter document in Firestore with the UID as the document ID
    const hunterDocRef = admin.firestore().doc(`outfitters/${outfitterId}/hunters/${uid}`);
    await hunterDocRef.set({
      name: hunterName,
      email: hunterEmail,
      phone: hunterPhone,
      uid, // Store the UID for easy reference
      role: 'hunter',
      accountSetupComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      outfitterId: outfitterId,  // Ensure we track the outfitter
    });

    // 5. Send the password reset email
    const mailOptions = {
      from: functions.config().gmail.email,
      to: hunterEmail,
      subject: 'Welcome to the Outfitter! Set Your Password',
      html: `<h1>Welcome to the Outfitter!</h1>
             <p>Hello ${hunterName},</p>
             <p>We've created an account for you. Please click the link below to set your password and complete your account setup:</p>
             <p><a href="${passwordResetLink}">Set your password</a></p>
             <p>Once you've set your password, you can log in to your dashboard.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${hunterEmail}`);

    return { message: 'Hunter added successfully.' };
  } catch (error) {
    console.error('Error adding hunter:', error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});


