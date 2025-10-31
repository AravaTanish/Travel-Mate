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

module.exports.postPaymentsPage = async (req, res) => {
  let { id } = req.params;
  let { startDate, endDate, adults, children } = req.body;
  if (adults < 1) {
    req.flash("error", "Adults should be at least 1!");
    return res.redirect(`/${id}/book`);
  }
  if (children < 0) {
    req.flash("error", "Children should be at least 0!");
    return res.redirect(`/${id}/book`);
  }
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) {
    req.flash("error", "End date should be after the start date!");
    return res.redirect(`/${id}/book`);
  }

  const listing = await Listing.findById(id);
  res.render("booking/payment.ejs", {
    days,
    adults,
    children,
    listing,
  });
};
