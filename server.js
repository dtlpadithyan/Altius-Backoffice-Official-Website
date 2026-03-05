require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API Route for handling form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, company, phone, message } = req.body;

        // Basic validation
        if (!name || !email || !company) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields (Name, Email, Company).'
            });
        }

        // Email validation regex (basic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email formatting matches user requirements
        const mailOptions = {
            from: `"${name} (via Website)" <${process.env.SMTP_USER}>`, // Uses submitter's name so it doesn't show "me"
            replyTo: email, // Set replyTo as the user who filled the form
            to: process.env.SMTP_USER, // Receiver email from .env
            subject: 'New Inquiry from Website',
            text: `Subject: New Inquiry from Website

Full Name: ${name}
Work Email: ${email}
Company: ${company}
Phone: ${phone || 'Not provided'}
Message: ${message || 'Not provided'}`
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Your inquiry has been sent successfully.'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending your inquiry. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
