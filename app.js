if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
var methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);

//let MONGO_URL = "mongodb://127.0.0.1:27017/tourhotel";
let dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600, //1 Day
});

store.on("error", () => {
  console.log("Error in Mongo Session Store", err);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
const LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy(
    {
      usernameField: "identifier",
      passwordField: "password",
    },
    async (identifier, password, done) => {
      try {
        const user = await User.findOne({
          $or: [{ username: identifier }, { email: identifier }],
        });
        if (!user) {
          return done(null, false, { message: "Incorrect username or email." });
        }
        // Use passport-local-mongoose's authenticate method
        const authResult = await User.authenticate()(user.username, password);
        if (authResult.error) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//Home Route
app.get("/", (req, res) => {
  res.render("listings/go.ejs");
});

// app.get("/demo", async (req, res) => {
//   let fakeuser = new User({
//     email: "student2@gmail.com",
//     username: "student2",
//   });
//   let registereduser = await User.register(fakeuser, "hello");
//   res.send(registereduser);
// });

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.all("*splat", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Oops! Something Went Wrong." } = err;
  res.status(statusCode).render("listings/error.ejs", { message });
  // res.send("Oops! Something Went Wrong.");
});

app.listen(1000, () => {
  console.log("Server is listening to port: 1000");
});
