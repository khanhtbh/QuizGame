# Quiz Game

## Introduction

Quiz Game is a web application that allows you to play quiz with others.

This is a project to study event driven architecture, aim to build a real-time quiz game.

## Features

### Admin

- Create quiz
- Observe leaderboard
- End quiz

### User

- Join quiz
- Answer question
- Score
- Observe leaderboard

<video src="./demo/demo.mov" width="640" height="480" controls></video>

## Development

### Components

- Client web application: HTML, CSS, JavaScript
  - Folder ./client/
- Web socket server: ExpressJS
  - Folder ./ws_service/
- Game service: ExpressJS
  - Folder ./game_service/

### Prerequisites

- NodeJS
- Redis server

### Run project

1. Start Redis server.
2. In each component folder, there is a configs.json file at {component_folder}/config/configs.json. Config the host as desired.
3. Enter `npm install` in each component folder to install dependencies.
4. Enter `node index.js` in each component folder to start the service.

## LICENSE
ICS



