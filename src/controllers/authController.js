const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const db = require('../db');

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

function signToken(user) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const password_hash = await bcrypt.hash(data.password, saltRounds);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [data.name, data.email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.issues });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await db.query(
      `SELECT id, name, email, role, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [data.email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(data.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    return res.json({ user: safeUser, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.issues });
    }
    return next(err);
  }
}

module.exports = { register, login };
