const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { me, list, getById, update, remove } = require('../controllers/usersController');

const router = express.Router();

// All /api/users routes require auth
router.use(requireAuth);

router.get('/me', me);

// Admin: list all users
router.get('/', requireRole('admin'), list);

// Get user by id: self or admin
router.get('/:id', (req, res, next) => {
  if (req.user.role === 'admin' || req.user.sub === req.params.id) return getById(req, res, next);
  return res.status(403).json({ error: 'Forbidden' });
});

// Update user by id: self or admin
router.patch('/:id', (req, res, next) => {
  if (req.user.role === 'admin' || req.user.sub === req.params.id) return update(req, res, next);
  return res.status(403).json({ error: 'Forbidden' });
});

// Delete user by id: self or admin
router.delete('/:id', (req, res, next) => {
  if (req.user.role === 'admin' || req.user.sub === req.params.id) return remove(req, res, next);
  return res.status(403).json({ error: 'Forbidden' });
});

module.exports = router;
