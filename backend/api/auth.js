import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/database.js";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "mise_secret_chef_jwt_key_2026";
const JWT_EXPIRES_IN = "30d";

// In-memory fallback cache when MongoDB is unconfigured or in offline demo mode
const memoryUsers = new Map();

// Seed initial demo profile in memory
const DEMO_EMAIL = "chef@mise.kitchen";
const DEMO_PASSWORD_HASH = bcrypt.hashSync("mise123", 8);
memoryUsers.set(DEMO_EMAIL, {
  _id: "demo-user-1",
  name: "Chef Durga",
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD_HASH,
  avatar: "👨‍🍳",
  dietaryPreferences: ["High Protein", "Gluten-Friendly"],
  spicePreference: "Bold & Smoky",
  kitchenStaples: ["Cultured Butter", "Garlic Confit", "Smoked Flake Salt", "Chili Crisp"],
  savedRecipes: [],
});

function createToken(userId, email) {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET);
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

  if (req.method === "OPTIONS") return res.status(204).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.pathname.replace(/^\/api\/auth\/?/, "");

  let body = req.body;
  if (typeof body === "string" && body.trim()) {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON format." });
    }
  }

  const db = await connectDB().catch(() => null);

  // 1. REGISTER
  if (action === "register" && req.method === "POST") {
    const { name, email, password, avatar } = body || {};
    if (!name || !email || !password) {
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
    if (!email || !password) {
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

  // 3. DEMO LOGIN (1-Click instant presentation profile)
  if (action === "demo-login" && req.method === "POST") {
    const demoUser = memoryUsers.get(DEMO_EMAIL);
    const token = createToken(demoUser._id, demoUser.email);
    return res.status(200).json({ token, user: sanitizeUser(demoUser) });
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
