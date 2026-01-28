const express = require('express');
const router = express.Router();
const playbackController = require('../controllers/playback.controller');

router.get('/playback', playbackController.getPlayback);

module.exports = router;
