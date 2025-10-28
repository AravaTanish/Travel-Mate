const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
//const { validateListing } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");
const { storage } = require("../cloudConfig.js");
const multer = require("multer");
const upload = multer({ storage });

router.get("/", isLoggedIn, wrapAsync(bookingController.getBookingPage));
router.get(
  "/payment",
  isLoggedIn,
  wrapAsync(bookingController.getPaymentsPage)
);

module.exports = router;
