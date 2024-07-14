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
const questionContainer = document.getElementById('question-container');
const scoreElement = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');

let websocket = null;
var gameId = null;
var numberOfQuestions = 0; 
var currentQuestionIdx = -1;
var userId = `u_${(Math.round(Date.now())).toString(36)}`;
var score = 0;
var question = null;

connectButton.addEventListener('click', async () => {
    gameId = gameIdInput.value;
    if (gameId === null) {
        alert('Please enter a valid Game ID.');
        return;
    }

    const response = await fetch(`${configs.game_service_host}/api/v1/games/${gameId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) { 
        alert("Invalid Game ID. Please enter a valid Game ID.");
        return;
    }

    gameInfoData = await response.json();
    numberOfQuestions = gameInfoData.data.no_questions;
    // Connect to WebSocket
    websocket = new WebSocket(`${configs.websocket_host}?game_id=${gameId}&role=player&player_name=${playerName.value}&user_id=${userId}`);

    websocket.onopen = () => {
        console.log('WebSocket connection opened');
        enterGameComponent.style.display = 'none';
        waitingScreen.style.display = 'block';
    };

    websocket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        let gameEvent = data['game_event'];
        if (gameEvent === 'connected') {
            gameIdInput.style.display = 'none';
            waitingScreen.style.display = 'block';
            websocket.send(JSON.stringify({ 
                command: 'get_question',
                data: {
                    game_id: gameId,
                    user_id: userId,
                    current_question_no: currentQuestionIdx  
                }
            }));
        } 
        else if (gameEvent === 'receive_question') {
            waitingScreen.style.display = 'none';
            questionContainer.style.display = 'block';   
            let eventData = data["data"];
            question = eventData.question;
            current_question_no = eventData.current_question_no;
            displayQuestion(question);
        }
        else if (gameEvent === 'answerCorrect') {
            score++;
            scoreElement.textContent = score;
            displayQuestion(data.nextQuestion);
        } else if (gameEvent === 'answerIncorrect') {
            displayQuestion(data.nextQuestion);
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
    const questionText = document.getElementById('question-text');
    const optionA = document.getElementById('option-a-text');
    const optionB = document.getElementById('option-b-text');
    const optionC = document.getElementById('option-c-text');
    const optionD = document.getElementById('option-d-text');
    optionA.innerHTML = question.A;
    optionB.innerHTML = question.B;
    optionC.innerHTML = question.C;
    optionD.innerHTML = question.D;
    questionText.innerHTML = question.question;   
}