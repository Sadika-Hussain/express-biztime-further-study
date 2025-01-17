/** BizTime express application. */
const express = require("express");

const app = express();
const ExpressError = require("./expressError");

const companies = require("./routes/companies");
const invoices = require("./routes/invoices");
const industries = require("./routes/industries");

app.use(express.json());

app.use("/companies", companies);
app.use("/invoices", invoices);
app.use("/industries", industries);


/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  return res.status(status).json({ message });
});


module.exports = app;
