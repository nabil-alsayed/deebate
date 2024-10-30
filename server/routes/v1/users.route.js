const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/user.controller');
const { authenticateRole } = require('../../utils/utils');
const upload = require('../../multer-config');

// User routes
router.get('/search', authenticateRole("user"), userController.searchUsers);
router.get('/', authenticateRole("admin"), userController.getAllUsers);
router.delete('/', authenticateRole("admin"), userController.deleteAllUsers);
router.get('/:userId', authenticateRole("user"), userController.getUser);
router.patch('/:userId', authenticateRole("user"), upload.single('profileImg'), userController.editUser); // Use multer for file upload
router.delete('/:userId', authenticateRole("user"), userController.deleteUser);

module.exports = router;
