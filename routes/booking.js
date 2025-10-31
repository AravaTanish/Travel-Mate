const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.getBookingPage));
router.post(
  "/payment",
  isLoggedIn,
  wrapAsync(bookingController.postPaymentsPage)
);
module.exports = router;
