// routes/pollRoutes.js
const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.post('/polls', pollController.createPoll);
router.get('/polls', pollController.getAllPolls);
router.get('/polls/:pollId', pollController.getPollById);
router.put('/polls/:pollId', pollController.updatePoll);

router.post('/polls/:pollId/questions', pollController.addQuestionSetToPoll);
router.get('/polls/:pollId/questions', pollController.getAllQuestionsForPoll);
router.get('/polls/:pollId/questions/:questionId', pollController.getQuestionById);
router.put('/polls/:pollId/questions/:questionId', pollController.updateQuestion);
router.delete('/polls/:pollId/questions/:questionId', pollController.deleteQuestion);

module.exports = router;
