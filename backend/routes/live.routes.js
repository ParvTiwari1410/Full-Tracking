const express = require("express");
const router = express.Router();
const controller = require("../controllers/live.controller");

router.get("/live/:deviceId", controller.getLiveLocation);

module.exports = router;
