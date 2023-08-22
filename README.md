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
The service agent things are stored in `./server/data/catalog.n3`
The goal of this demonstrator, is to show that we can enable dynamic dialog interaction
that allows the asking for age and depending on the availble information will show alcoholic beverages or not

## Asking questions

Now you can start asking questions to the agent!
For this, I advise to use a tool such as PostMan.

To communicate with the agent, send a `POST` request to `localhost:<port>`.
Set the `Content-Type` header to `text/n3`/

Example message bodies can be found in the `examples/` directory.
