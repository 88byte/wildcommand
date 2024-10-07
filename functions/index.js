const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const axios = require("axios"); // Import axios to make HTTP requests to Firebase REST API

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

// Setup Nodemailer using Firebase environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

// Function to send a magic login link and welcome email to the hunter
exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate(async (snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const hunterName = hunter.name;
    const outfitterId = context.params.outfitterId;
    const hunterId = context.params.hunterId;

    try {
      // Firebase project API key
      const firebaseApiKey = functions.config().firebase.api_key;

      // Firebase Authentication REST API endpoint for generating the sign-in link
      const apiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`;

      // Payload for generating the magic link
      const payload = {
        requestType: "EMAIL_SIGNIN",  // Set request type to 'EMAIL_SIGNIN' for the magic link
        email: hunterEmail,
        returnUrl: `https://wildcommand.com/#/hunter-setup?outfitterId=${outfitterId}&hunterId=${hunterId}`,  // Set the return URL to hunter setup page
        handleCodeInApp: true
      };

      // Generate the magic link via Firebase Auth REST API
      const response = await axios.post(apiUrl, payload);

      // The magic link is returned in the response data
      const magicLink = response.data.oobLink;

      // Send the magic link via email using Nodemailer
      const mailOptions = {
        from: functions.config().gmail.email,
        to: hunterEmail,
        subject: 'Welcome to the Outfitter!',
        html: `<h1>Welcome to the Outfitter!</h1>
               <p>Hello ${hunterName},</p>
               <p>You’ve been added to the outfitter platform. Click the link below to log in and complete your account setup.</p>
               <p><a href="${magicLink}">Click here to log in and complete your setup</a></p>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Magic link email sent to ${hunterEmail}`);
    } catch (error) {
      console.error('Error sending magic link or email:', error.message);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
