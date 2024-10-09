const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const axios = require("axios"); // Import axios to make HTTP requests to Firebase REST API
const { getAuth } = require("firebase-admin/auth");



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

// Send the magic login link and instructions to the user
exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate(async (snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const hunterName = hunter.name;

    const actionCodeSettings = {
      // URL to redirect the user to the hunter setup page after they click the magic link
      url: `https://wildcommand.com/#/hunter-setup`,
      handleCodeInApp: true,
    };

    try {
      // Generate the sign-in link
      const auth = getAuth();
      const magicLink = await auth.generateSignInWithEmailLink(hunterEmail, actionCodeSettings);

      // Send the link via email using Nodemailer
      const mailOptions = {
        from: functions.config().gmail.email,
        to: hunterEmail,
        subject: 'Welcome to Wild Command! Complete Your Setup',
        html: `<h1>Welcome to Wild Command!</h1>
               <p>Hello ${hunterName},</p>
               <p>You're almost ready to start your adventure! Click the link below to log in and complete your account setup.</p>
               <p><strong><a href="${magicLink}">Click here to log in and set your password</a></strong></p>
               <p>Once logged in, you will be able to set your password and complete your profile.</p>
               <p>If you have any questions, feel free to reach out to us!</p>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email with magic link sent to ${hunterEmail}`);
    } catch (error) {
      console.error('Error sending welcome email:', error.message);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });