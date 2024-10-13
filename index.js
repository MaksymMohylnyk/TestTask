require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./infrastructure/routes.js");
const morgan = require('morgan');
const logger = require('./infrastructure/logger.js');
const port = process.env.PORT || 3000;
const app = express();

app.use(morgan(function (tokens, req, res) {
  const msg = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
  ].join(' ');
  logger.http(msg);
  return null;
})
);

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use("/", routes);

app.listen(port, (error) => {
  if (error) return console.log(`Error: ${error}`);

  console.log(`Server is listening on port ${port}`);
});
