import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);


export const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // tumhara email jaha message receive hoga
      subject: `New Message from ${name} (Acadify Contact Form)`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #2563eb;">New Inquiry Received!</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully!",
    });

  } catch (error) {
    console.error("Contact Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};
