const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer"); // Add this line to import Nodemailer


admin.initializeApp();

// Function to set custom claims for users (outfitter, guide, hunter)
exports.setUserRole = functions.https.onCall((data, context) => {
  const { uid, role, outfitterId } = data;

  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  // Set custom claims
  return admin.auth().setCustomUserClaims(uid, { role, outfitterId })
    .then(() => {
      return { message: `Success! Role ${role} assigned to user.` };
    })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});




// Setup Nodemailer using Firebase environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email, // Retrieve from Firebase config
    pass: functions.config().gmail.password // Retrieve from Firebase config
  }
});


exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate((snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const inviteLink = `https://wildcommand.com/#/hunter-setup?hunterId=${context.params.hunterId}`;




    const mailOptions = {
      from: functions.config().gmail.email,
      to: hunterEmail,
      subject: 'Welcome to the Outfitter!',
      html: `<h1>Welcome to the Outfitter!</h1>
             <p>Hello ${hunter.name},</p>
             <p>You’ve been invited to join the outfitter. Click the link below to set up your account.</p>
             <a href="${inviteLink}">Set Up Your Account</a>`
    };

    return transporter.sendMail(mailOptions)
      .then((info) => {
        console.log(`Email sent to ${hunterEmail}: ${info.response}`);
        return { success: true };
      })
      .catch((error) => {
        console.error('Error sending email to ', hunterEmail, ': ', error);
        return { success: false, error: error.message };
      });
  });


