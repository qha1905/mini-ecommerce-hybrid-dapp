const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.get("/:userId?", cartController.getCartByUser);
router.post("/", cartController.addToCart);
router.put("/:id", cartController.updateCartItem);
router.delete("/item/:id", cartController.removeCartItem);
router.delete("/clear/:userId?", cartController.clearCart);

module.exports = router;
