// emailService.js
import { functions } from '../firebase'; // Import functions from your firebase.js
import { httpsCallable } from 'firebase/functions';

export const sendHuntBookingEmails = async ({ huntDetails, guideEmails, hunterEmails }) => {
  try {
    // Create callable function
    const sendEmails = httpsCallable(functions, 'sendHuntBookingEmails'); // Ensure the name matches your Cloud Function
    
    // Pass the hunt details and emails to the cloud function
    const result = await sendEmails({
      huntDetails,
      guideEmails,
      hunterEmails,
    });

    console.log('Email successfully sent:', result.data);
  } catch (error) {
    console.error('Error sending booking emails:', error);
    throw error;
  }
};
