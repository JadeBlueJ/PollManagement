const Sequelize = require("sequelize");
const Poll = require("../models/Poll.js");
const Question = require("../models/Question.js");
const Option = require("../models/Option.js");

const fetchPollAnalytics = async (req, res) => {
  try {
    const pollId = req.params.pollId;

    // Retrieve poll details with associated questions and options
    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: Question,
          include: [Option],
        },
      ],
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    // Extract relevant poll analytics
    const pollAnalytics = {
      totalVotes: poll.totalVotes,
      questions: poll.Questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: question.Options.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
        })),
      })),
    };

    res.status(200).json({
      success: true,
      data: pollAnalytics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const fetchPollAnalyticsAll = async (req, res) => {
    try {
      // Retrieve all polls with associated questions and options
      const allPolls = await Poll.findAll({
        include: [
          {
            model: Question,
            include: [Option],
          },
        ],
      });
  
      // Aggregate statistics for all polls grouped by question IDs
      const overallAnalytics = {
        totalVotes: allPolls.reduce((total, poll) => total + poll.totalVotes, 0),
        questions: allPolls.reduce((aggregate, poll) => {
          poll.Questions.forEach((question) => {
            const existingQuestion = aggregate.find((aggQuestion) => aggQuestion.id === question.id);
            if (existingQuestion) {
              question.Options.forEach((option) => {
                const existingOption = existingQuestion.Options.find((aggOption) => aggOption.id === option.id);
                if (existingOption) {
                  existingOption.votes += option.votes;
                } else {
                  existingQuestion.Options.push({
                    id: option.id,
                    text: option.text,
                    votes: option.votes,
                  });
                }
              });
            } else {
              aggregate.push({
                id: question.id,
                text: question.text,
                Options: question.Options.map((option) => ({
                  id: option.id,
                  text: option.text,
                  votes: option.votes,
                })),
              });
            }
          });
          return aggregate;
        }, []),
      };
  
      res.status(200).json({
        success: true,
        data: overallAnalytics,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  };
module.exports = {
  fetchPollAnalytics,
  fetchPollAnalyticsAll,
};
