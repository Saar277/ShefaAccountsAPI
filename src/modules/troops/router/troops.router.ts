import express = require("express");
import troopsController from "../controller/troops.controller";

const router = express.Router();

/**
 * get all the examples
 */
router.route('/')
    .get(troopsController.getAllTroops);

router.route('/:id')
    .get(troopsController.getTroopsById);

router.route('/types/amounts')
    .get(troopsController.getAmountsByType);    

module.exports = router;