const express = require("express");
const router = express.Router();
const { register, login, getProfile, linkWallet } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getProfile);
router.post("/link-wallet", verifyToken, linkWallet);

module.exports = router;
