# Conversational Data Exchange

This is a WIP for work on Conversational Data Exchange (Dialogical Reasoning)
The current implementation can handle receiving a message, formulating a response and returning the response.
The communication mechanism to exchange the messages is very much still WIP

## Prerequisites

This project requires you to have the latest version of the [EYE reasoner](https://github.com/eyereasoner/eye) available using the `eye` command.

## Install

```
npm install
```

## Run

```
cd agent/
node agent.js -p <port> -d ../server/data/ -r ../server/rules
```
This will start up the agent that can respond to questions

## Agent data
The service agent things are stored in `./server_agent/data/catalog.n3`
The goal of this demonstrator, is to show that we can enable dynamic dialog interaction
that allows the asking for age and depending on the availble information will show alcoholic beverages or not

## Setup experiment

### Start client agent
```
cd client_agent
node agent.js -p 2345 -c config.json
```

### start server agent
```
cd server_agent
node agent.js -p 3456 -c config.json
```

### run experiment
```
cd test
bash test.sh
```