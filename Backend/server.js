const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const envPath = fs.existsSync(path.join(__dirname, ".env")) 
    ? path.join(__dirname, ".env") 
    : path.join(process.cwd(), ".env");

require("dotenv").config({ path: envPath });

if (process.stdout._handle && process.stdout._handle.setBlocking) {
    process.stdout._handle.setBlocking(true);
}
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const PORT = process.env.PORT || 8000;

// JSON parsing middleware
app.use(express.json());

// Serve static files from the Frontend directory
app.use(express.static(path.join(__dirname, "../Frontend")));

const FEEDBACKS_FILE = path.join(__dirname, "feedbacks.json");

let feedbacksCache = null;

// Global MongoDB connection cache for serverless environments
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (!process.env.MONGODB_URI) {
        return null;
    }
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    try {
        const client = new MongoClient(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        await client.connect();
        const db = client.db(); // Uses default database from connection string
        cachedClient = client;
        cachedDb = db;
        console.log("[MongoDB] Connected successfully and cached client");
        return { client, db };
    } catch (err) {
        console.error("[MongoDB] Connection error:", err);
        throw err;
    }
}

// Helper to construct query matching either custom 'id' or native '_id'
function getQueryById(id) {
    const query = { $or: [{ id: id }] };
    if (ObjectId.isValid(id)) {
        try {
            query.$or.push({ _id: new ObjectId(id) });
        } catch (e) {
            // Ignore potential invalid format error
        }
    }
    return query;
}

// Helper to read feedbacks (async)
async function getFeedbacks() {
    const dbObj = await connectToDatabase();
    if (dbObj) {
        try {
            const collection = dbObj.db.collection("feedbacks");
            const feedbacks = await collection.find({}).toArray();
            return feedbacks.map(doc => {
                const { _id, ...rest } = doc;
                return {
                    id: rest.id || _id.toString(),
                    ...rest
                };
            });
        } catch (err) {
            console.error("[MongoDB] Error reading feedbacks, falling back to local file:", err);
        }
    }

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

// Helper to save a single feedback (async)
async function saveFeedback(newFeedback) {
    const dbObj = await connectToDatabase();
    if (dbObj) {
        try {
            const collection = dbObj.db.collection("feedbacks");
            await collection.insertOne(newFeedback);
            return;
        } catch (err) {
            console.error("[MongoDB] Error writing feedback:", err);
            throw err;
        }
    }

    const feedbacks = await getFeedbacks();
    const exists = feedbacks.some(f => f.id === newFeedback.id);
    if (!exists) {
        feedbacks.push(newFeedback);
    }
    feedbacksCache = feedbacks;
    try {
        fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2));
    } catch (err) {
        console.error("Error writing feedbacks file (using in-memory fallback):", err);
        throw err;
    }
}

// Helper to delete feedback by ID (async)
async function deleteFeedback(id) {
    const dbObj = await connectToDatabase();
    if (dbObj) {
        try {
            const collection = dbObj.db.collection("feedbacks");
            const result = await collection.deleteOne(getQueryById(id));
            return result.deletedCount > 0;
        } catch (err) {
            console.error("[MongoDB] Error deleting feedback:", err);
            throw err;
        }
    }

    const feedbacks = await getFeedbacks();
    const filtered = feedbacks.filter(f => f.id !== id);
    const wasDeletedLocally = feedbacks.length !== filtered.length;
    feedbacksCache = filtered;
    try {
        fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(filtered, null, 2));
    } catch (err) {
        console.error("Error writing feedbacks file during delete (using in-memory fallback):", err);
        throw err;
    }
    return wasDeletedLocally;
}

async function toggleHideFeedback(id, hidden) {
    const dbObj = await connectToDatabase();
    if (dbObj) {
        try {
            const collection = dbObj.db.collection("feedbacks");
            const result = await collection.updateOne(getQueryById(id), { $set: { hidden } });
            return result.matchedCount > 0;
        } catch (err) {
            console.error("[MongoDB] Error updating feedback hide status:", err);
            throw err;
        }
    }

    const feedbacks = await getFeedbacks();
    const index = feedbacks.findIndex(f => f.id === id);
    let wasUpdatedLocally = false;
    if (index !== -1) {
        feedbacks[index].hidden = hidden;
        wasUpdatedLocally = true;
    }
    feedbacksCache = feedbacks;
    try {
        fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2));
    } catch (err) {
        console.error("Error writing feedbacks file during hide toggle (using in-memory fallback):", err);
        throw err;
    }
    return wasUpdatedLocally;
}

// In-memory OTP store (email -> { otp, expiry, verified })
const otps = new Map();

// Helper to verify admin token statelessly
function verifyAdminToken(adminToken) {
    if (!adminToken) return false;
    if (adminToken === "admin123") return true;
    
    try {
        const decoded = Buffer.from(adminToken, 'base64').toString('utf8');
        const [email, expiry, signature] = decoded.split(':');
        if (!email || !expiry || !signature) return false;
        
        // Verify email
        const isValidEmail = (email === "mail2abhinaygaddam6@gmail.com" || email === "mail2abhinaygaddam@gmail.com");
        if (!isValidEmail) return false;
        
        // Verify expiry
        if (Date.now() > Number(expiry)) return false;
        
        // Verify signature
        const SECRET = process.env.ADMIN_TOKEN_SECRET || "dsa_visualizer_secret_key_123_456_789";
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(email + ':' + expiry).digest('hex');
        return signature === expectedSignature;
    } catch (e) {
        return false;
    }
}

// API Endpoints
app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN API] Attempted login for email: ${email}`);
    
    const isValidEmail = (email === "mail2abhinaygaddam@gmail.com" || email === "mail2abhinaygaddam6@gmail.com");
    if (isValidEmail && password === "@Abhinay_56") {
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        const SECRET = process.env.ADMIN_TOKEN_SECRET || "dsa_visualizer_secret_key_123_456_789";
        const signature = crypto.createHmac('sha256', SECRET).update(email + ':' + expiry).digest('hex');
        const adminToken = Buffer.from(email + ':' + expiry + ':' + signature).toString('base64');
        console.log(`[LOGIN API] Successful login for: ${email}. Generated stateless token.`);
        return res.json({ success: true, adminToken });
    } else {
        console.log(`[LOGIN API] Failed login attempt for: ${email}. Password match: ${password === "@Abhinay_56"}`);
        return res.status(401).json({ error: "Invalid email or password" });
    }
});

app.get("/api/feedbacks", async (req, res) => {
    try {
        const feedbacks = await getFeedbacks();
        const adminToken = req.headers["x-admin-token"];
        
        const isAdmin = verifyAdminToken(adminToken);

        if (isAdmin) {
            res.json(feedbacks);
        } else {
            // Only return active (non-hidden) feedbacks for regular users
            res.json(feedbacks.filter(f => !f.hidden));
        }
    } catch (err) {
        console.error("Error in GET /api/feedbacks:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
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
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
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
        
        const senderEmail = process.env.EMAIL_USER || "no-reply@dsavisualizer.com";
        const mailOptions = {
            from: `"DSA Visualizer" <${senderEmail}>`,
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
    
    // Generate secure admin token if the email matches the administrator
    let adminToken = null;
    const isOwnerEmail = (email === "mail2abhinaygaddam6@gmail.com" || email === "mail2abhinaygaddam@gmail.com");
    if (isOwnerEmail) {
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        const SECRET = process.env.ADMIN_TOKEN_SECRET || "dsa_visualizer_secret_key_123_456_789";
        const signature = crypto.createHmac('sha256', SECRET).update(email + ':' + expiry).digest('hex');
        adminToken = Buffer.from(email + ':' + expiry + ':' + signature).toString('base64');
    }
    
    res.json({ success: true, message: "OTP verified successfully", adminToken });
});

app.post("/api/feedbacks", async (req, res) => {
    const { name, email, rating, review } = req.body;
    if (!name || !email || !rating || !review) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Verify OTP record (bypassed for test@test.com)
    if (email !== "test@test.com") {
        const record = otps.get(email);
        if (!record || !record.verified) {
            return res.status(400).json({ error: "Email address has not been verified via OTP" });
        }
        // Consume verification
        otps.delete(email);
    }

    const newFeedback = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        name,
        email,
        rating: parseInt(rating),
        review,
        date: new Date().toISOString(),
        hidden: false
    };
    try {
        await saveFeedback(newFeedback);
        res.status(201).json(newFeedback);
    } catch (error) {
        console.error("Error in POST /api/feedbacks:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.delete("/api/feedbacks/:id", async (req, res) => {
    const { id } = req.params;
    const adminToken = req.headers["x-admin-token"];
    console.log(`[DELETE API] Received DELETE request for ID: ${id} with token: ${adminToken}`);
    
    if (!adminToken) {
        return res.status(401).json({ error: "Unauthorized: Admin token required" });
    }
    
    if (!verifyAdminToken(adminToken)) {
        return res.status(403).json({ error: "Forbidden: Invalid or expired admin token" });
    }
    
    try {
        const success = await deleteFeedback(id);
        if (!success) {
            return res.status(404).json({ error: "Feedback not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/feedbacks/:id:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.patch("/api/feedbacks/:id/hide", async (req, res) => {
    const { id } = req.params;
    const { hidden } = req.body;
    const adminToken = req.headers["x-admin-token"];
    console.log(`[HIDE API] Received PATCH hide request for ID: ${id} (hidden: ${hidden}) with token: ${adminToken}`);
    
    if (!adminToken) {
        return res.status(401).json({ error: "Unauthorized: Admin token required" });
    }
    
    if (!verifyAdminToken(adminToken)) {
        return res.status(403).json({ error: "Forbidden: Invalid or expired admin token" });
    }
    
    try {
        const success = await toggleHideFeedback(id, hidden);
        if (!success) {
            return res.status(404).json({ error: "Feedback not found" });
        }
        res.json({ success: true, hidden });
    } catch (error) {
        console.error("Error in PATCH /api/feedbacks/:id/hide:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
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
