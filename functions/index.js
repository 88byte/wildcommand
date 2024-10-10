const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { getAuth } = require("firebase-admin/auth"); // Use this for Firebase Admin Auth

admin.initializeApp();

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

// Send a welcome email after creating hunter's account
exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate(async (snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const hunterName = hunter.name;
    const outfitterId = context.params.outfitterId;
    const hunterId = context.params.hunterId;

    try {
      // 1. Create the user in Firebase Authentication
      const auth = getAuth();
      const userRecord = await auth.createUser({
        email: hunterEmail,
        emailVerified: false,
        displayName: hunterName,
        password: 'TemporaryPassword123!', // Use a temporary password or omit it for email/password reset flow
        disabled: false,
      });

      console.log(`Created new user for hunter: ${userRecord.uid}`);

      // 2. Set custom claims for the new user
      await auth.setCustomUserClaims(userRecord.uid, { role: 'hunter', outfitterId: outfitterId });

      // 3. Generate a password reset link for the hunter to set their own password
      const passwordResetLink = await auth.generatePasswordResetLink(hunterEmail);

      // 4. Send the email with the password reset link instead of a magic login link
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
    } catch (error) {
      console.error('Error creating user or sending email:', error.message);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
