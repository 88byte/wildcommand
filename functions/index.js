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

exports.addGuide = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'outfitter') {
    throw new functions.https.HttpsError('permission-denied', 'Only outfitters can add guides.');
  }

  const { guideName, guideEmail, guidePhone } = data;
  const outfitterId = context.auth.token.outfitterId;

  try {
    const auth = getAuth();

    // Create the guide user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: guideEmail,
      emailVerified: false,
      displayName: guideName,
      password: 'TemporaryPassword123!', // Temporary password
      disabled: false,
    });

    const uid = userRecord.uid;

    // Set custom claims for the guide
    await auth.setCustomUserClaims(uid, { role: 'guide', outfitterId });

    // Generate a password reset link for the guide to set their password
    const passwordResetLink = await auth.generatePasswordResetLink(guideEmail);

    // Create a Firestore document for the guide
    const guideDocRef = admin.firestore().doc(`outfitters/${outfitterId}/guides/${uid}`);
    await guideDocRef.set({
      name: guideName,
      email: guideEmail,
      phone: guidePhone,
      uid,
      role: 'guide',
      accountSetupComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      outfitterId,
    });

    // Send the password reset email
    const mailOptions = {
      from: functions.config().gmail.email,
      to: guideEmail,
      subject: 'Welcome to the Outfitter! Set Your Password',
      html: `<h1>Welcome to the Outfitter!</h1>
             <p>Hello ${guideName},</p>
             <p>We've created an account for you. Please click the link below to set your password and complete your account setup:</p>
             <p><a href="${passwordResetLink}">Set your password</a></p>
             <p>Once you've set your password, you can log in to your dashboard.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return { message: 'Guide added successfully.' };
  } catch (error) {
    console.error('Error adding guide:', error.message);
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


exports.sendHuntBookingEmails = functions.https.onCall(async (data, context) => {
  const { huntDetails, guideEmails, hunterEmails } = data;

  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  try {
    // Log received data for debugging
    console.log('Received hunt details:', huntDetails);
    console.log('Guide Emails (IDs):', guideEmails);
    console.log('Hunter Emails (IDs):', hunterEmails);

    // Fetch the email addresses from Firestore
    const guideDetails = await Promise.all(
      guideEmails.map(async (guideId) => {
        const guideDoc = await admin.firestore().doc(`outfitters/${huntDetails.outfitterId}/guides/${guideId}`).get();
        return guideDoc.exists ? guideDoc.data() : null;
      })
    );
    const hunterEmailsResolved = await Promise.all(
      hunterEmails.map(async (hunterId) => {
        const hunterDoc = await admin.firestore().doc(`outfitters/${huntDetails.outfitterId}/hunters/${hunterId}`).get();
        return hunterDoc.exists ? hunterDoc.data().email : null;
      })
    );

    // Filter out null values in case any document doesn't exist or lacks an email field
    const validGuideDetails = guideDetails.filter(Boolean);
    const validGuideEmails = validGuideDetails.map(guide => guide.email);
    const validHunterEmails = hunterEmailsResolved.filter(Boolean);

    // If no valid recipients are found, throw an error
    if (!validGuideEmails.length && !validHunterEmails.length) {
      throw new functions.https.HttpsError('invalid-argument', 'No valid email recipients found.');
    }

    // Log the resolved email addresses
    console.log('Resolved Guide Emails:', validGuideEmails);
    console.log('Resolved Hunter Emails:', validHunterEmails);

    // Prepare email content for guides
    const guideEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #1a73e8;">New Hunt Booked</h1>
        <p>A new hunt has been scheduled. Please check the calendar in your dashboard for details.</p>
        <p><strong>Hunt Details:</strong></p>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Hunt Type:</strong> ${huntDetails.huntType}</li>
          <li><strong>Date:</strong> ${huntDetails.date}</li>
          <li><strong>Start Time:</strong> ${huntDetails.startTime}</li>
          <li><strong>Location:</strong> ${huntDetails.location}</li>
          <li><strong>Notes:</strong> ${huntDetails.notes}</li>
        </ul>
        <p>Log in to your dashboard to view the full details and update your availability.</p>
      </div>
    `;

    // Prepare email content for hunters
    const hunterEmailHtml = (guide) => `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #1a73e8;">Your Hunt Has Been Booked</h1>
        <p>Your hunt has been booked successfully. Here are the details:</p>
        <p><strong>Hunt Details:</strong></p>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Hunt Type:</strong> ${huntDetails.huntType}</li>
          <li><strong>Date:</strong> ${huntDetails.date}</li>
          <li><strong>Start Time:</strong> ${huntDetails.startTime}</li>
          <li><strong>Location:</strong> ${huntDetails.location}</li>
          <li><strong>Notes:</strong> ${huntDetails.notes}</li>
        </ul>
        <p><strong>Your Guide:</strong></p>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Name:</strong> ${guide.name}</li>
          <li><strong>Email:</strong> ${guide.email}</li>
          <li><strong>Phone:</strong> ${guide.phone}</li>
        </ul>
        <p>Please contact your guide if you have any specific questions or need further instructions.</p>
      </div>
    `;

    // Send emails to guides
    for (const guide of validGuideDetails) {
      console.log(`Sending email to guide: ${guide.email}`);
      await transporter.sendMail({
        from: functions.config().gmail.email,
        to: guide.email,
        subject: 'New Hunt Booked - Please Check Calendar',
        html: guideEmailHtml,
      });
    }

    // Send emails to hunters
    for (const hunterEmail of validHunterEmails) {
      const assignedGuide = validGuideDetails[0]; // Assuming the first guide is assigned to the hunt
      console.log(`Sending email to hunter: ${hunterEmail}`);
      await transporter.sendMail({
        from: functions.config().gmail.email,
        to: hunterEmail,
        subject: 'Your Hunt Has Been Booked',
        html: hunterEmailHtml(assignedGuide),
      });
    }

    console.log('Emails sent successfully');
    return { message: 'Emails sent successfully.' };
  } catch (error) {
    console.error('Error sending emails:', error.message);
    throw new functions.https.HttpsError('internal', 'Failed to send emails.');
  }
});


