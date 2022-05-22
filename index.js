require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const axios = require("axios");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRYPTO NODE JS API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./index.js"],
};
const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const server = app.listen(process.env.PORT, () => {
  console.log(`Listing to the port ${process.env.PORT}`);
});

const socketHandler = socketIO(server);
socketHandler.on("connection", (socket) => {
  socket.on("connect_error", () => {
    console.log("connection error!");
  });
  socket.on("disconnect", () => {
    console.log("client discooneted!");
  });
  console.log("client connected");
  socket.emit("crypto", "Hello Cryptos client!");
});

const getPrices = () => {
  axios
    .get(process.env.LIST_URL, {
      headers: {
        "x-messari-api-key": process.env.API_KEY,
      },
    })
    .then((response) => {
      const priceList = response.data.data.map((item) => {
        return {
          id: item.id,
          name: item.symbol,
          price: item.metrics.market_data.price_usd,
        };
      });
      socketHandler.emit("crypto", priceList);
    })
    .catch((err) => {
      console.log(err);
      socketHandler.emit("crypto", {
        error: true,
        message: "Error fetching prices data from API",
      });
    });
};

setInterval(() => {
  getPrices();
}, 50000);

/**
 * @swagger
 *  components:
 *    schema:
 *      cryptos:
 *        type: object
 *        properties:
 *          status:
 *            type: object
 *          data:
 *            type: object
 *
 */

/**
 * @swagger
 * /cryptos/profile/{id}:
 *  get:
 *    summary: This api is used to check if get method is working or not
 *    description: This api is used to check if het method is working or not
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: String ID required
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: To test Get method
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              items:
 *                $ref: '#components/schema/cryptos'
 */
app.get("/cryptos/profile/:id", (req, res) => {
  const cryptoId = req.params.id;
  axios
    .get(`${process.env.BASE_URL_V2}/${cryptoId}/profile`, {
      headers: {
        "x-messari-api-key": process.env.API_KEY,
      },
    })
    .then((responseData) => {
      res.json(responseData.data.data);
    })
    .catch((err) => {
      res.json({
        error: true,
        message: "Error fetching prices data from API",
        errorDetails: err,
      });
    });
});

app.get("/cryptos/profile", (req, res) => {
  res.json({ error: true, message: "Missing crypto Id in to API url" });
});
/**
 * @swagger
 * /cryptos/market-data/{id}:
 *  get:
 *    summary: This api is used to check if get method is working or not
 *    description: This api is used to check if het method is working or not
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: String ID required
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: To test Get method
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              items:
 *                $ref: '#components/schema/cryptos'
 */
app.get("/cryptos/market-data/:id", (req, res) => {
  const cryptoId = req.params.id;
  axios
    .get(`${process.env.BASE_URL_V1}/${cryptoId}/metrics/market-data`, {
      headers: {
        "x-messari-api-key": process.env.API_KEY,
      },
    })
    .then((responseData) => {
      res.json(responseData.data.data);
    })
    .catch((err) => {
      res.json({
        error: true,
        message: "Error fetching prices data from API",
        errorDetails: err,
      });
    });
});
app.get("/cryptos/market-data", (req, res) => {
  res.json({ error: true, message: "Missing crypto Id in to API url" });
});
