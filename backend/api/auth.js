import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/database.js";
import { User } from "../models/User.js";
import { legacyAuthEnabled, legacyAuthSecret } from "../lib/legacy-auth-config.js";

const JWT_EXPIRES_IN = "30d";

// Local development only; production password routes require MongoDB.
const memoryUsers = new Map();

function createToken(userId, email) {
  return jwt.sign({ id: userId, email }, legacyAuthSecret(), { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256", issuer: "mise-legacy", audience: "mise-legacy-auth" });
}

function verifyToken(authHeader) {
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, legacyAuthSecret(), { algorithms: ["HS256"], issuer: "mise-legacy", audience: "mise-legacy-auth" });
  } catch {
    return null;
  }
}

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.pathname.replace(/^\/api\/auth\/?/, "");
  if (action === "demo-login") {
    return res.status(403).json({ error: "Demo accounts cannot obtain API credentials. Sign in with Puter to generate recipes." });
  }
  if (!legacyAuthEnabled()) {
    return res.status(503).json({ error: "Password authentication is disabled. Use Puter sign-in." });
  }
  if (!legacyAuthSecret()) {
    return res.status(503).json({ error: "Password authentication is unavailable. Use Puter sign-in." });
  }

  let body = req.body;
  if (typeof body === "string" && body.trim()) {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON format." });
    }
  }

  const db = await connectDB().catch(() => null);
  if (!db && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
    return res.status(503).json({ error: "Password authentication is unavailable. Use Puter sign-in." });
  }

  // 1. REGISTER
  if (action === "register" && req.method === "POST") {
    const { name, email, password, avatar } = body || {};
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (db) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        avatar: avatar || "🧑‍🍳",
      });

      const token = createToken(user._id, user.email);
      return res.status(201).json({ token, user: sanitizeUser(user) });
    } else {
      if (memoryUsers.has(cleanEmail)) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const user = {
        _id: `user-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        avatar: avatar || "🧑‍🍳",
        dietaryPreferences: [],
        spicePreference: "Medium Heat",
        kitchenStaples: ["Olive Oil", "Flake Sea Salt", "Garlic", "Butter"],
        savedRecipes: [],
      };
      memoryUsers.set(cleanEmail, user);

      const token = createToken(user._id, user.email);
      return res.status(201).json({ token, user: sanitizeUser(user) });
    }
  }

  // 2. LOGIN
  if (action === "login" && req.method === "POST") {
    const { email, password } = body || {};
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user;
    if (db) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryUsers.get(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken(user._id, user.email);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  }

  // Auth Guard for subsequent routes
  const decoded = verifyToken(req.headers.authorization);
  if (!decoded) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }

  let currentUser;
  if (db) {
    currentUser = await User.findById(decoded.id);
  } else {
    currentUser = memoryUsers.get(decoded.email);
  }

  if (!currentUser) {
    return res.status(404).json({ error: "Chef profile not found." });
  }

  // 4. GET /api/auth/me
  if ((action === "me" || action === "") && req.method === "GET") {
    return res.status(200).json({ user: sanitizeUser(currentUser) });
  }

  // 5. PUT /api/auth/preferences
  if (action === "preferences" && (req.method === "PUT" || req.method === "POST")) {
    const { dietaryPreferences, spicePreference, kitchenStaples, name, avatar } = body || {};

    if (dietaryPreferences !== undefined) currentUser.dietaryPreferences = dietaryPreferences;
    if (spicePreference !== undefined) currentUser.spicePreference = spicePreference;
    if (kitchenStaples !== undefined) currentUser.kitchenStaples = kitchenStaples;
    if (name !== undefined) currentUser.name = name;
    if (avatar !== undefined) currentUser.avatar = avatar;

    if (db) {
      await currentUser.save();
    } else {
      memoryUsers.set(decoded.email, currentUser);
    }

    return res.status(200).json({ user: sanitizeUser(currentUser) });
  }

  // 6. POST /api/auth/sync-recipes
  if (action === "sync-recipes" && req.method === "POST") {
    const { recipes } = body || {};
    if (Array.isArray(recipes)) {
      const existing = currentUser.savedRecipes || [];
      const combined = [...existing];

      recipes.forEach((rec) => {
        if (!combined.some((r) => r.id === rec.id || r.title === rec.title)) {
          combined.push(rec);
        }
      });

      currentUser.savedRecipes = combined;

      if (db) {
        await currentUser.save();
      } else {
        memoryUsers.set(decoded.email, currentUser);
      }
    }

    return res.status(200).json({ savedRecipes: currentUser.savedRecipes });
  }

  return res.status(404).json({ error: `Auth endpoint /api/auth/${action} not found.` });
}
