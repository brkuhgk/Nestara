const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth/authenticate.js');
const houseController = require('../controllers/houseController');

// GET /api/houses - Get all houses user is part of
router.get('/', auth, houseController.getHouses);

// POST /api/houses - Create new house
router.post('/', auth, houseController.createHouse);

// GET /api/houses/:id - Get house details with members
router.get('/:id', auth, houseController.getHouse);

// POST /api/houses/:id/members - Add member to house
router.post('/:id/members', auth, houseController.addMember);

// POST /api/houses/join - Join house using address
router.post('/join', auth, houseController.joinHouse);

module.exports = router;