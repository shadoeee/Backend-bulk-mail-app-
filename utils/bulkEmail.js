import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const bulkEmail = async (email, subject, message, user, pass) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: process.env.EMAIL_PORT,
      secure: Boolean(process.env.SECURE),
      auth: {
        user: user,
        pass: pass
      }
    });

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: subject,
      html: message,
    });

    return info;
  } catch (error) {
    return error;
  }
};

export default bulkEmail;
