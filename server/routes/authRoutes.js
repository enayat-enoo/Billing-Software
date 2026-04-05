const express = require("express");
const router = express.Router();
const { login, logout, getMe } = require("../controllers/authController");
const auth = require("../middleware/auth"); // ← add this line

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getMe);

module.exports = router;