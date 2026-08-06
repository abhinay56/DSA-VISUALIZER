require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 8000;

// JSON parsing middleware
app.use(express.json());

// Serve static files from the Frontend directory
app.use(express.static(path.join(__dirname, "../Frontend")));

const FEEDBACKS_FILE = path.join(__dirname, "feedbacks.json");

let feedbacksCache = null;

// Helper to read feedbacks
function readFeedbacks() {
    if (feedbacksCache !== null) {
        return feedbacksCache;
    }
    try {
        if (fs.existsSync(FEEDBACKS_FILE)) {
            const data = fs.readFileSync(FEEDBACKS_FILE, "utf8");
            feedbacksCache = JSON.parse(data);
        } else {
            feedbacksCache = [];
        }
    } catch (err) {
        console.error("Error reading feedbacks file:", err);
        feedbacksCache = [];
    }
    return feedbacksCache;
}

// Helper to write feedbacks
function writeFeedbacks(feedbacks) {
    feedbacksCache = feedbacks;
    try {
        fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2));
    } catch (err) {
        console.error("Error writing feedbacks file (using in-memory fallback):", err);
    }
}

// In-memory OTP store (email -> { otp, expiry, verified })
const otps = new Map();

// API Endpoints
app.get("/api/feedbacks", (req, res) => {
    res.json(readFeedbacks());
});

app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    otps.set(email, { otp, expiry, verified: false });
    
    console.log(`\n-----------------------------------------`);
    console.log(`[OTP Verification] Generated OTP for ${email}: ${otp}`);
    console.log(`-----------------------------------------\n`);
    
    try {
        const nodemailer = require("nodemailer");
        let transporter;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            // Auto-generate ethereal email credentials for local dev
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        }
        
        const mailOptions = {
            from: '"DSA Visualizer" <no-reply@dsavisualizer.com>',
            to: email,
            subject: "Your DSA Visualizer OTP Verification Code",
            text: `Hello,\n\nYour OTP code to submit feedback is: ${otp}\n\nThis code expires in 5 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                     <h2 style="color: #2563eb; margin-top: 0;">DSA Visualizer Verification</h2>
                     <p style="font-size: 1.1rem; color: #334155;">Hello,</p>
                     <p style="font-size: 1.1rem; color: #334155;">Your OTP code to submit feedback is:</p>
                     <div style="font-size: 2.2rem; font-weight: bold; letter-spacing: 4px; color: #1e1b4b; background-color: #e0f2fe; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; max-width: 250px;">
                       ${otp}
                     </div>
                     <p style="color: #64748b; font-size: 0.95rem;">This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
                   </div>`
        };
        
        const info = await transporter.sendMail(mailOptions);
        if (!process.env.EMAIL_USER) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`[OTP Verification] Sent to test email. Ethereal Preview URL: ${previewUrl}`);
        }
        res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("EMAIL ERROR:", error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post("/api/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }
    
    const record = otps.get(email);
    if (!record) {
        return res.status(400).json({ error: "No OTP requested for this email" });
    }
    
    if (Date.now() > record.expiry) {
        otps.delete(email);
        return res.status(400).json({ error: "OTP code has expired" });
    }
    
    if (record.otp !== otp) {
        return res.status(400).json({ error: "Incorrect OTP code" });
    }
    
    record.verified = true;
    otps.set(email, record);
    
    res.json({ success: true, message: "OTP verified successfully" });
});

app.post("/api/feedbacks", (req, res) => {
    const { name, email, rating, review } = req.body;
    if (!name || !email || !rating || !review) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Verify OTP record
    const record = otps.get(email);
    if (!record || !record.verified) {
        return res.status(400).json({ error: "Email address has not been verified via OTP" });
    }
    
    // Consume verification
    otps.delete(email);

    const feedbacks = readFeedbacks();
    const newFeedback = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        name,
        email,
        rating: parseInt(rating),
        review,
        date: new Date().toISOString()
    };
    feedbacks.push(newFeedback);
    writeFeedbacks(feedbacks);
    res.status(201).json(newFeedback);
});

app.delete("/api/feedbacks/:id", (req, res) => {
    const { id } = req.params;
    const adminPass = req.headers["x-admin-passcode"];
    console.log(`[DELETE API] Received DELETE request for ID: ${id} with passcode: ${adminPass}`);
    
    if (adminPass !== "admin123") {
        return res.status(401).json({ error: "Unauthorized: Admin access required" });
    }
    
    let feedbacks = readFeedbacks();
    const filtered = feedbacks.filter(f => f.id !== id);
    if (feedbacks.length === filtered.length) {
        return res.status(404).json({ error: "Feedback not found" });
    }
    writeFeedbacks(filtered);
    res.json({ success: true });
});

// Fallback to index.html for other requests
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT}/index.html in your browser`);
    });
}

module.exports = app;
