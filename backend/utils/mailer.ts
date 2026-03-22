import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "sushant.tamang1919@gmail.com",
		pass: "wtzz xzuk gqhp muoh"
	}
});

export const sendEmail = async (to: string, subject: string, html: string) => {
	try {
		const mailOptions = {
			from: '"PetConnect" <sushant.tamang1919@gmail.com>',
			to,
			subject,
			html
		};
		const info = await transporter.sendMail(mailOptions);
		console.log("Email sent:", info.messageId);
		return true;
	} catch (error) {
		console.error("Error sending email:", error);
		return false;
	}
};
