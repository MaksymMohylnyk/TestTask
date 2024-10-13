const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller.js')

router.get('/sales/', controller.getSalesDb);
router.get('/notion/', controller.getNotionDb);
router.post('/notion/toSales', controller.transferNotionToSales);
router.post('/sales/toNotion', controller.transferSalesToNotion);

module.exports = router;