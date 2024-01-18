// controllers/pollController.js
const Sequelize=require('sequelize')
const Poll = require("../models/Poll.js");
const Question = require("../models/Question.js");
const Option = require("../models/Option.js");
const User = require("../models/User.js");
const UserAnswer=require('../models/UserAnswer.js')

const createPoll = async (req, res) => {
  try {
    // Destructuring necessary fields from the request body
    const { title, category, startDate, endDate, minReward, maxReward } =
      req.body;

    // Creating a new poll
    const newPoll = await Poll.create({
      title,
      category,
      startDate,
      endDate,
      minReward,
      maxReward,
    });

    res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: newPoll,
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllPolls = async (req, res) => {
  try {
    // Fetch all polls with associated questions and options
    const allPolls = await Poll.findAll({
      include: [
        {
          model: Question,
          include: Option,
        },
      ],
    });

    if (allPolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No polls found",
      });
    }

    // Map the results to the required format
    const pollsData = allPolls.map((poll) => ({
      title: poll.title,
      category: poll.category,
      startDate: poll.startDate,
      endDate: poll.endDate,
      totalVotes: poll.totalVotes, // Assuming you update this field somewhere in your logic
      numQuestionSets: poll.Questions.length,
      detailsOfOneQuestion: {
        questionText: poll.Questions.length > 0 ? poll.Questions[0].text : null,
        options: poll.Questions.length > 0 ? poll.Questions[0].Options : null,
      },
    }));

    res.status(200).json({
      success: true,
      data: pollsData,
    });
  } catch (error) {
    console.error("Error fetching all polls:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}; 
 
const getPollById = async (req, res) => {
  // Implementation to get a poll by ID
};

const updatePoll = async (req, res) => {
  // Implementation to update a poll
};

const addQuestionSetToPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { type, text, options } = req.body;

    // Check if the poll exists
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Poll not found",
      });
    }

    // Create a new question associated with the poll
    const newQuestion = await Question.create({
      type,
      text,
      PollId: pollId, // Associate the question with the specified poll
    });

    // Create options for the question
    const createdOptions = await Promise.all(
      options.map((optionText) =>
        Option.create({ text: optionText, QuestionId: newQuestion.id })
      )
    );

    // Update the question with the created options
    // newQuestion.setOptions(createdOptions);

    res.status(201).json({
      success: true,
      message: "Question set added to poll successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error adding question set to poll:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const serveUserPollQuestions = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch distinct polls the user has answered
    const answeredPolls = await UserAnswer.findAll({
      attributes: ['PollId'],
      where: {
        UserId: userId,
      },
      group: ['PollId'],
    });

    if (answeredPolls.length === 0) {
      // If the user hasn't answered any questions, serve the first poll and its first question
      const firstPoll = await Poll.findOne({
        include: [
          {
            model: Question,
            include: Option,
            order: [['id', 'ASC']],
          },
        ],
        order: [['id', 'ASC']],
      });
      if (!firstPoll) {
        return res.status(404).json({
          success: false,
          message: 'No polls found',
        });
      }
      const firstQuestion = firstPoll.Questions[0];
      res.status(200).json({
        success: true,
        data: {
          pollId: firstPoll.id,
          question: {
            id: firstQuestion.id,
            text: firstQuestion.text,
            options: firstQuestion.Options,
          },
        },
      });
    } else {
      // Iterate over the user's answered polls to find the next unanswered question
      for (const answeredPoll of answeredPolls) {
        const pollId = answeredPoll.PollId;

        // Find the answered questions in the poll
        const answeredQuestions = await UserAnswer.findAll({
          where: {
            UserId: userId,
            PollId: pollId,
          },
        });

        // Find all questions in the poll
        const allQuestions = await Question.findAll({
          where: {
            PollId: pollId,
          },
          include: [Option],
          order: [['id', 'ASC']],
        });

        // Find the next unanswered question
        const nextUnansweredQuestion = allQuestions.find((question) => {
          return !answeredQuestions.some((answeredQuestion) => answeredQuestion.QuestionId === question.id);
        });

        if (nextUnansweredQuestion) {
          res.status(200).json({
            success: true,
            data: {
              pollId: pollId,
              question: {
                id: nextUnansweredQuestion.id,
                text: nextUnansweredQuestion.text,
                options: nextUnansweredQuestion.Options,
              },
            },
          });
          return; // Exit the loop after serving the question
        }
        // If all questions in the poll are answered, move to the next answered poll
      }

      // If all questions in all polls are answered, serve the first question in the first unanswered poll
      const firstUnansweredPoll = await Poll.findOne({
        where: {
          id: { [Sequelize.Op.notIn]: answeredPolls.map((answeredPoll) => answeredPoll.PollId) },
        },
        include: [
          {
            model: Question,
            include: [Option],
            order: [['id', 'ASC']],
          },
        ],
        order: [['id', 'ASC']],
      });

      if (!firstUnansweredPoll) {
        return res.status(200).json({
          success: true,
          message: 'No new questions exist for the specified poll',
        });
      }

      const firstUnansweredQuestion = firstUnansweredPoll.Questions[0];
      res.status(200).json({
        success: true,
        data: {
          pollId: firstUnansweredPoll.id,
          question: {
            id: firstUnansweredQuestion.id,
            text: firstUnansweredQuestion.text,
            options: firstUnansweredQuestion.Options,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error serving user poll questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const submitPoll = async (req, res) => {
  try {
    const { userId, pollId } = req.params;
    const { questionId, selectedOption } = req.body;

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if the poll exists
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // Find the question in the poll
    const question = await Question.findOne({
      where: {
        PollId: pollId,
        id: questionId,
      },
      include: [Option],
      order: [['id', 'ASC']],
    });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Invalid question',
      });
    }

    // Check if the selected option is valid for the question
    const validOption = question.Options.some((opt) => opt.id === selectedOption);
    if (!validOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option for the question',
      });
    }

    // Store user's answer
    await UserAnswer.create({
      UserId: userId,
      PollId: pollId,
      QuestionId: question.id,
      OptionId: selectedOption,
    });

    // Calculate reward (randomized within the specified range)
    const rewardAmount = Math.floor(Math.random() * (poll.maxReward - poll.minReward + 1) + poll.minReward);

    // Update user's total rewards
    await User.update(
      {
        totalRewards: Sequelize.literal(`totalRewards + ${rewardAmount}`),
      },
      {
        where: {
          id: userId,
        },
      }
    );

    // Update poll analytics (total votes and counts of options selected)
    await Poll.update(
      {
        totalVotes: Sequelize.literal('totalVotes + 1'),
      },
      {
        where: {
          id: pollId,
        },
      }
    );

    await Option.update(
      {
        votes: Sequelize.literal('votes + 1'),
      },
      {
        where: {
          id: selectedOption,
        },
      }
    );

    // Return response with reward amount
    res.status(200).json({
      success: true,
      data: {
        rewardAmount,
      },
    });
  } catch (error) {
    console.error('Error submitting poll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getAllQuestionsForPoll = async (req, res) => {
  // Implementation to get all questions for a poll
};

const getQuestionById = async (req, res) => {
  // Implementation to get a question by ID
};

const updateQuestion = async (req, res) => {
  // Implementation to update a question
};

const deleteQuestion = async (req, res) => {
  // Implementation to delete a question
};

module.exports = {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  addQuestionSetToPoll,
  getAllQuestionsForPoll,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  serveUserPollQuestions,
  submitPoll
};
