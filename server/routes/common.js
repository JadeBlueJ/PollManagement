// routes/pollRoutes.js
const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.post('/polls', pollController.createPoll);
router.get('/polls', pollController.getAllPolls);

router.get('/polls/:userId/questions', pollController.serveUserPollQuestions);
router.post('/users/:userId/polls/:pollId/submit', pollController.submitPoll);

router.post('/polls/:pollId/questions', pollController.addQuestionSetToPoll);

router.put('/polls/:pollId', pollController.updatePollDetails);
router.put('/polls/:pollId/questions/:questionId', pollController.updateQuestionSet);

module.exports = router;
