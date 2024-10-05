const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer"); // Import Nodemailer

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

// Function to add a hunter and send the welcome email with a temporary password
exports.sendWelcomeEmail = functions.firestore
  .document('outfitters/{outfitterId}/hunters/{hunterId}')
  .onCreate(async (snap, context) => {
    const hunter = snap.data();
    const hunterEmail = hunter.email;
    const hunterName = hunter.name;
    const outfitterId = context.params.outfitterId;
    const hunterId = context.params.hunterId;
    
    // Generate a temporary password
    const tempPassword = 'TempPassword123!';

    try {
      // Create the hunter in Firebase Authentication with the temporary password
      const userRecord = await admin.auth().createUser({
        uid: hunterId,
        email: hunterEmail,
        password: tempPassword,
        displayName: hunterName
      });

      console.log(`Hunter created in Firebase Auth: ${userRecord.uid}`);

      // Set custom claims to associate the hunter with the outfitter and set role
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'hunter',
        outfitterId: outfitterId,
        accountSetupComplete: false // Mark account as incomplete for setup
      });

      // Send welcome email with the temporary password
      const inviteLink = `https://wildcommand.com/#/hunter-setup?outfitterId=${outfitterId}&hunterId=${hunterId}`; // Include both outfitterId and hunterId
      const mailOptions = {
        from: functions.config().gmail.email,
        to: hunterEmail,
        subject: 'Welcome to the Outfitter!',
        html: `<h1>Welcome to the Outfitter!</h1>
               <p>Hello ${hunterName},</p>
               <p>You’ve been added to the outfitter platform. Please log in using the temporary password below and complete your account setup.</p>
               <p><strong>Temporary Password:</strong> ${tempPassword}</p>
               <p><a href="${inviteLink}">Click here</a> to complete your account setup.</p>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${hunterEmail}`);
    } catch (error) {
      console.error('Error creating user or sending email:', error);
      throw new functions.https.HttpsError('internal', 'Error creating hunter or sending welcome email.');
    }
  });
