// src/controllers/timeBlockController.js
const { StatusCodes } = require('http-status-codes');
const TimeBlockService = require('../services/timeBlockService');

const timeBlockController = {
  createTimeBlock: async (req, res) => {
    try {
      const timeBlock = await TimeBlockService.createTimeBlock({
        ...req.body,
        user_id: req.user.id
      });
      
      res.status(StatusCodes.CREATED).json(timeBlock);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: error.message || 'Failed to create time block'
      });
    }
  },


  getTimeBlocks: async (req, res) => {
    try {
      const { house_id, date } = req.query;
      
      if (!house_id || !date) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'House ID and date are required'
        });
      }

      // Parse the date to ensure it's in the correct format
      const formattedDate = new Date(date).toISOString().split('T')[0];

      const timeBlocks = await TimeBlockService.getTimeBlocks(house_id, formattedDate);
      
      return res.json({
        status: 'success',
        data: timeBlocks
      });
      
    } catch (error) {
      console.error('Error getting time blocks:', error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: error.message || 'Failed to fetch time blocks'
      });
    }
  },

  deleteTimeBlock: async (req, res) => {
    try {
      await TimeBlockService.deleteTimeBlock(req.params.id, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: error.message || 'Failed to delete time block'
      });
    }
  },

  getUserTimeBlocks: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Start date and end date are required'
        });
      }

      const timeBlocks = await TimeBlockService.getTimeBlocksByUser(
        req.user.id,
        start_date,
        end_date
      );
      
      res.json(timeBlocks);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: error.message || 'Failed to fetch user time blocks'
      });
    }
  },
  searchTimeBlocks: async (req, res) => {
    try {
      const { house_id, date } = req.body;
      
      if (!house_id || !date) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'House ID and date are required',
          message: 'House ID and date are required'
        });
      }

      // Parse the date to ensure it's in the correct format
      const formattedDate = new Date(date).toISOString().split('T')[0];

      const timeBlocks = await TimeBlockService.getTimeBlocks(house_id, formattedDate);
      console.log('timeBlocks=========', timeBlocks);
      return res.json({
        status: 'success',
        data: timeBlocks
      });
      
    } catch (error) {
      console.error('Error searching time blocks:', error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: error.message || 'Failed to search time blocks'
      });
    }
  }
};

module.exports = timeBlockController;