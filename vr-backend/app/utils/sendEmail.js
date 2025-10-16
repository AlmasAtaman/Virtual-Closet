import { Resend } from 'resend';

// Initialize Resend lazily to prevent crashes on server startup if API key is missing
let resend = null;

const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Please configure it in your Railway dashboard.');
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

const sendEmail = async (options) => {
  try {
    const client = getResendClient();

    const { data, error } = await client.emails.send({
      from: 'noreply@vestko.com',
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (err) {
    console.error('Email sending error:', err);
    throw err;
  }
};

export default sendEmail; 