const { z } = require('zod');
const db = require('../db');

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function me(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.sub]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    return res.json({ users: result.rows.map(sanitizeUser) });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    if (data.role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(data.role);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, email, role, created_at, updated_at`,
      values
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.issues });
    }
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );
    const deleted = result.rows[0];
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { me, list, getById, update, remove };
