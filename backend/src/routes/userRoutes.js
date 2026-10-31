const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserVisibility,
  deleteUser,
} = require("../controllers/userController");

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/toggle-visibility", toggleUserVisibility);
router.delete("/:id", deleteUser);

module.exports = router;
