const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const auth = require("./routes/api/auth");
const users = require("./routes/api/users");
const jobs = require("./routes/api/jobs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable All CORS Requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  // Other CORS headers can be set here
  // ...
  next();
});
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-src https://public.tableau.com/views/JobDashboardv1/JobAnalytics?:language=en-US&:display_count=n&:embed=true&:origin=viz_share_link"
  );
  return next();
});

const db = process.env.mongoURI;

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/jobs", jobs);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
