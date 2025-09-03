const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const { validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const { storage } = require("../cloudConfig.js");
const multer = require("multer");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.postNewListing)
  );

router.get("/new", isLoggedIn, listingController.getNewListing);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListings))
  .put(
    isOwner,
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.putEditListing)
  )
  .delete(isOwner, isLoggedIn, wrapAsync(listingController.deleteListing));

router.get(
  "/:id/edit",
  isOwner,
  isLoggedIn,
  wrapAsync(listingController.getEditListing)
);

module.exports = router;
