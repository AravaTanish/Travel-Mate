const express = require("express");
const router = express.Router();
const rulesController = require("../controllers/rules.js");

router.get("/terms", rulesController.terms);
router.get("/privacy", rulesController.privacy);

module.exports = router;
