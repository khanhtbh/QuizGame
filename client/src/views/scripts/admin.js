var configs = null;
async function getConfigs() {
    const res = await fetch('/res/configs.json');
    configs = await res.json();
}

getConfigs();

const gameIdElement = document.getElementById('game-id');
const leaderboardSection = document.getElementById('leaderboard-section');
const createGameForm = document.getElementById('create-game-form');
const createGameButton = document.getElementById('create-game-button'); // Get the create game button
const endGameButton = document.getElementById('end-game-button');
const leaderboardTitle = document.getElementById('leaderboard-title');
const leaderboardTable = document.getElementById('leaderboard-table').getElementsByTagName('tbody')[0];
const adminSection = document.getElementById('admin-section');

let gameId = null;
let ws = null;

// Create Game
createGameButton.addEventListener('click', async () => {

    const gameName = document.getElementById('game-name').value;
    const numQuestions = document.getElementById('num-questions').value;

    const response = await fetch(`${configs.game_service_host}/api/v1/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_name: gameName,
          no_questions: numQuestions
        })
    });

    if (response.ok) {
        var data = await response.json();
        data = data.data;
        gameId = data.game_id;
        leaderboardTitle.innerHTML = `Leaderboard for ${gameName} - Game ID: ${gameId}`;
        // Show leaderboard section, hide admin section
        adminSection.classList.add('hidden');
        leaderboardSection.classList.remove('hidden');

        // Connect to WebSocket
        ws = new WebSocket(`${configs.websocket_host}?game_id=${gameId}&role=admin`); // Replace with your server URL

        // Handle WebSocket connection events
        ws.onopen = () => {
            console.log('WebSocket connection opened');
            fetchLeaderboard();
        };

        ws.onmessage = (event) => {
            const leaderboard = JSON.parse(event.data);
            let data = JSON.parse(event.data);
            let gameEvent = data['game_event'];
            if (gameEvent === 'leaderboard_update') { 
                fetchLeaderboard();
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
    } else {
        console.error('Error creating game:', response.status);
    }
});

// Fetch Leaderboard
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

// End Game
endGameButton.addEventListener('click', async () => {
    const response = await fetch(`${configs.game_service_host}/api/v1/games/${gameId}`, { method: 'DELETE' });
    if (response.ok) {
        // Show admin section, hide leaderboard section
        leaderboardSection.classList.add('hidden');
        adminSection.classList.remove('hidden');

        // Close the WebSocket connection
        if (ws) {
            ws.close();
            ws = null;
        }

        // Reset gameId
        gameId = null;
    } else {
        console.error('Error ending game:', response.status);
    }
});