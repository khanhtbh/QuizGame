var QuestionBank = require('../resources/questions.json');
var _ = require('lodash');

class QuestionRepos {
    static getRandomQuestions(numberOfQuestions) {
        return _.sampleSize(QuestionBank, numberOfQuestions);
    }
}