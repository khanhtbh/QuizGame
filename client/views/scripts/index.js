var configs = null;
async function getConfigs() {
    const res = await fetch('/res/configs.json');
    configs = await res.json();
}

getConfigs();


const gameIdInput = document.getElementById('game-id');
const connectButton = document.getElementById('connect-button');
const waitingScreen = document.getElementById('waiting-screen');
const questionScreen = document.getElementById('question-screen');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const scoreElement = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');

let websocket = null;
let gameId = null;
let score = 0;

connectButton.addEventListener('click', () => {
    gameId = gameIdInput.value;
    if (gameId) {
        // Connect to WebSocket
        websocket = new WebSocket(`${configs.websocket_host}/game/${gameId}`);

        websocket.onopen = () => {
            console.log('WebSocket connection opened');
            gameIdInput.style.display = 'none';
            connectButton.style.display = 'none';
            waitingScreen.style.display = 'block';
        };

        websocket.onmessage = (event) => {
            if (event.type === 'gameStarted') {
                waitingScreen.style.display = 'none';
                questionScreen.style.display = 'block';
                displayQuestion(data.question);
            } else if (event.type === 'answerCorrect') {
                score++;
                scoreElement.textContent = score;
                displayQuestion(data.nextQuestion);
            } else if (event.type === 'answerIncorrect') {
                displayQuestion(data.nextQuestion);
            } else if (event.type === 'leaderboardUpdate') {
                updateLeaderboard(data.leaderboard);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    } else {
        alert('Please enter a valid Game ID.');
    }
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