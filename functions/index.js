const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
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

// Send a magic login link to the hunter
exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate(async (snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const hunterName = hunter.name;
    const outfitterId = context.params.outfitterId;
    const hunterId = context.params.hunterId;

    try {
      // Generate the continueUrl with outfitterId and hunterId
      const continueUrl = `https://wildcommand.com/#/hunter-setup?outfitterId=${outfitterId}&hunterId=${hunterId}`;

      // Send the magic link via email using Nodemailer
      const mailOptions = {
        from: functions.config().gmail.email,
        to: hunterEmail,
        subject: 'Welcome to the Outfitter!',
        html: `<h1>Welcome to the Outfitter!</h1>
               <p>Hello ${hunterName},</p>
               <p>Click the link below to log in and complete your account setup.</p>
               <p><a href="${continueUrl}">Click here to log in and complete your setup</a></p>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Magic link email sent to ${hunterEmail}`);
    } catch (error) {
      console.error('Error sending magic link or email:', error.message);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

