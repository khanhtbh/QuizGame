var configs = null;
async function getConfigs() {
    const res = await fetch('/res/configs.json');
    configs = await res.json();
}

getConfigs();

const enterGameComponent = document.getElementById('game-id-input');
const playerName = document.getElementById('player-name');
const gameIdInput = document.getElementById('game-id');
const connectButton = document.getElementById('connect-button');
const waitingScreen = document.getElementById('waiting-screen');
const questionScreen = document.getElementById('question-screen');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const scoreElement = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');

let websocket = null;
var gameId = null;
var numberOfQuestions = 0; 
var userId = `u_${(Math.round(Date.now())).toString(36)}`;
var score = 0;

connectButton.addEventListener('click', () => {
    gameId = gameIdInput.value;
    if (gameId === null) {
        alert('Please enter a valid Game ID.');
        return;
    }
    // Connect to WebSocket
    websocket = new WebSocket(`${configs.websocket_host}?game=${gameId}&role=player&player_name=${playerName.value}&user_id=${userId}`);

    websocket.onopen = () => {
        console.log('WebSocket connection opened');
        enterGameComponent.style.display = 'none';
        waitingScreen.style.display = 'block';
    };

    websocket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        let gameEvent = data['game-event'];
        if (gameEvent === 'connected') {
            waitingScreen.style.display = 'none';
            questionScreen.style.display = 'block';
            displayQuestion(data.question);
        } else if (gameEvent === 'answerCorrect') {
            score++;
            scoreElement.textContent = score;
            displayQuestion(data.nextQuestion);
        } else if (gameEvent === 'answerIncorrect') {
            displayQuestion(data.nextQuestion);
        } else if (gameEvent === 'leaderboardUpdate') {
            updateLeaderboard(data.leaderboard);
        }
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
        console.log('WebSocket connection closed');
    };

});

function displayQuestion(question) {
    questionText.textContent = question.text;
    answersContainer.innerHTML = '';
    question.answers.forEach((answer) => {
        const answerElement = document.createElement('div');
        answerElement.classList.add('answer');
        answerElement.textContent = answer.text;
        answerElement.addEventListener('click', () => {
            websocket.send(JSON.stringify({ type: 'answer', answerId: answer.id }));
        });
        answersContainer.appendChild(answerElement);
    });
}

function updateLeaderboard(leaderboard) {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry) => {
        const listItem = document.createElement('li');
        listItem.classList.add('leaderboard-entry');
        listItem.textContent = `${entry.playerName}: ${entry.score}`;
        leaderboardList.appendChild(listItem);
    });
}