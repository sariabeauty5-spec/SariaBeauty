const express = require('express');
const router = express.Router();
const { authUser, registerUser, updateUserProfile, getUsers, updateUserAdmin } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/', registerUser);
router.route('/profile').put(protect, updateUserProfile);
router.get('/', protect, admin, getUsers);
router.put('/:id/admin', protect, admin, updateUserAdmin);

module.exports = router;
