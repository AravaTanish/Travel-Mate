const Listing = require("../models/listing.js");

module.exports.getBookingPage = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate("owner")
    .populate("reviews");
  let avgRating = 0;
  for (let review of listing.reviews) {
    avgRating += review.rating;
  }
  let no_of_reviews = (count = listing.reviews.length);
  if (no_of_reviews > 0) {
    avgRating = avgRating / no_of_reviews;
    avgRating = Math.round(avgRating * 10) / 10;
  }
  res.render("booking/booking.ejs", { listing, no_of_reviews, avgRating });
};

module.exports.getPaymentsPage = async (req, res) => {
  let { startDate, endDate, adults, children } = req.params;
  res.render("booking/payment.ejs", { startDate, endDate, adults, children });
};
