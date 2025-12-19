export const contactEmailTemplate = (data: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) => ({
  from: "noreply@e-campushub.com",
  to: "support@e-campushub.com",
  replyTo: data.email,
  subject: `Contact Form: ${data.subject}`,
  html: `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${data.firstName} ${data.lastName}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <h3>Message:</h3>
    <p>${data.message.replace(/\n/g, "<br>")}</p>
  `,
});
