const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryVisibility,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/toggle-visibility", toggleCategoryVisibility);
router.delete("/:id", deleteCategory);

module.exports = router;
