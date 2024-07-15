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
const scoreElement = document.getElementById('player-score');
const leaderboardList = document.getElementById('leaderboard-list');
const submitAnswerButton = document.getElementById('submit-answer');
const endGameContainer = document.getElementById('end-game-container');
const leaderboardTable = document.getElementById('leaderboard-table').getElementsByTagName('tbody')[0];

let websocket = null;
var gameId = null;
var numberOfQuestions = 0; 
var currentQuestionIdx = -1;
var userId = `u_${(Math.round(Date.now())).toString(36)}`;
var score = 0;
var question = null;
var quizEnded = false;

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
    connectWs();

});

const connectWs = () => {
    websocket = new WebSocket(`${configs.websocket_host}?game_id=${gameId}&role=player&player_name=${playerName.value}&user_id=${userId}`);

    websocket.onopen = () => {
        console.log('WebSocket connection opened');
        enterGameComponent.style.display = 'none';
        waitingScreen.style.display = 'block';
    };

    websocket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        let gameEvent = data['game_event'];
        let eventData = data["data"];
        if (gameEvent === 'connected') {
            if (currentQuestionIdx !== -1) { // retry connection, current question already received
                waitingScreen.style.display = 'none';
                questionContainer.style.display = 'block';   
                return;
            }
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
            question = eventData.question;
            currentQuestionIdx = eventData.question_no;
            displayQuestion(question);
        }
        else if (gameEvent === 'answer_result') {
            var correctAnswer = eventData.correct_answer;
            score += eventData.award_score;
            var message = `Your answer is correct. You have ${score} points.`;
            if (eventData.award_score == 0) {
                message = `Your answer is wrong. The correct answer is ${correctAnswer}. You have ${score} points.`;
            }
            alert(message);
            scoreElement.innerText = score;
            websocket.send(JSON.stringify({ 
                command: 'get_question',
                data: {
                    game_id: gameId,
                    user_id: userId,
                    current_question_no: currentQuestionIdx  
                }
            }));
        }
        else if (gameEvent === 'user_end_quiz') {
            quizEnded = true;
            questionContainer.style.display = 'none';   
            endGameContainer.style.display = 'block';
            const finalScoreElement = document.getElementById('final-score');
            finalScoreElement.innerHTML = score;
            const userIdElement = document.getElementById('user-id');
            userIdElement.innerHTML = userId;
            fetchLeaderboard();
        }
        else if (gameEvent === 'leaderboard_update') {
            if (!quizEnded) { 
                return;
            }
            fetchLeaderboard();
        }
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
        console.log('WebSocket connection closed');
        if (!quizEnded) {
            // game not end, close due to server issue, try to connect again
            setTimeout(() => {
                connectWs();    
            }, 5000);
            
        }
    };
}

submitAnswerButton.addEventListener('click', () => {
    // Get the selected answer
    let selectedAnswer = document.querySelector('input[name="answer"]:checked').value;
    websocket.send(JSON.stringify({ 
        command: 'answer_question',
        data: {
            game_id: gameId,
            user_id: userId,
            current_question_no: currentQuestionIdx,
            answer: selectedAnswer  
        }
    }));
  });

function displayQuestion(question) {
    const questionTitle = document.getElementById('question-title');
    const questionText = document.getElementById('question-text');
    const optionA = document.getElementById('option-a-text');
    const optionB = document.getElementById('option-b-text');
    const optionC = document.getElementById('option-c-text');
    const optionD = document.getElementById('option-d-text');
    optionA.innerHTML = question.A;
    optionB.innerHTML = question.B;
    optionC.innerHTML = question.C;
    optionD.innerHTML = question.D;
    const prevCheck = document.querySelector('input[name="answer"]:checked');
    if (prevCheck) {
        prevCheck.checked = false;
    }
    questionText.innerHTML = question.question;   
    questionTitle.innerHTML = `Question ${currentQuestionIdx + 1} of ${numberOfQuestions}`;
}

const fetchLeaderboard = async () => {
    const response = await fetch(`${configs.game_service_host}/api/v1/games/${gameId}/leaderboard`);
    if (response.ok) {
        const leaderboard = await response.json();
        updateLeaderboard(leaderboard.data.leaderboard);
    } else {
        console.error('Error fetching leaderboard:', response.status);
    }
};

// Update Leaderboard (using data from WebSocket)
const updateLeaderboard = (leaderboard) => {
    leaderboardTable.innerHTML = ''; // Clear existing leaderboard
    let rank = 1;
    leaderboard.forEach(entry => {
        const row = leaderboardTable.insertRow();
        const rankCell = row.insertCell();
        const playerCell = row.insertCell();
        const scoreCell = row.insertCell();

        rankCell.textContent = rank;
        playerCell.textContent = entry.value;
        scoreCell.textContent = entry.score;

        rank++;
    });
};