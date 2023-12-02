const express = require("express");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const signupRoutes = require('./signupRoutes');
const loginRoutes = require('./loginRoutes');


app.use(express.static("public"));
app.use(cors());


app.use('/signup', signupRoutes); // Collega la route di registrazione
app.use('/login', loginRoutes); // Collega la route di login

const serv = https.createServer({
    key: fs.readFileSync("certificati/domain.key"),
    cert: fs.readFileSync("certificati/domain.crt"),
    passphrase: "Andreia"
}, app);

const wss = new WebSocket.Server({ server: serv });
const users = {};

wss.on("connection", (connection) => {
    connection.on("message", (message) => {
        try {
            let data;
            try {
                data = JSON.parse(message.toString());
            } catch (e) {
                console.log("Error parsing JSON");
                data = {};
            }
            switch (data.type) {
                case "login":
                    console.log("User logged in as", data.name);
                    if (users[data.name]) {
                        sendTo(connection, {
                            type: "login",
                            success: false
                        });
                    } else {
                        users[data.name] = connection;
                        connection.name = data.name;
                        sendTo(connection, {
                            type: "login",
                            success: true
                        });
                    }
                    break;
                case "offer":
                    console.log("Sending offer to", data.name);
                    const connOffer = users[data.name];
                    if (connOffer) {
                        connection.otherName = data.name;
                        sendTo(connOffer, {
                            type: "offer",
                            offer: data.offer,
                            name: connection.name
                        });
                    }
                    break;
                case "answer":
                    console.log("Sending answer to", data.name);
                    const connAnswer = users[data.name];
                    if (connAnswer) {
                        connection.otherName = data.name;
                        sendTo(connAnswer, {
                            type: "answer",
                            answer: data.answer
                        });
                    }
                    break;
                case "candidate":
                    console.log("Sending candidate to", data.name);
                    const connCandidate = users[data.name];
                    if (connCandidate) {
                        sendTo(connCandidate, {
                            type: "candidate",
                            candidate: data.candidate
                        });
                    }
                    break;
                case "leave":
                    console.log("Disconnecting user from", data.name);
                    const connTheir = users[data.name];
                    const connUser = users[data.theirusername];
                    delete users[data.name];
                    delete users[data.username];
                    if (connTheir) {
                        sendTo(connTheir, {
                            type: "leave"
                        });
                    }
                    if (connUser) {
                        sendTo(connUser, {
                            type: "leave"
                        });
                    }
                    break;
                default:
                    sendTo(connection, {
                        type: "error",
                        message: "Unrecognized command: " + data.type
                    });
                    break;
            }
        } catch (error) {
            console.error(error);
        }
    });

    connection.on("close", () => {
        if (connection.name) {
            delete users[connection.name];
            if (connection.otherName) {
                console.log("Disconnecting user from", connection.otherName);
                const conn = users[connection.otherName];
                if (conn) {
                    conn.otherName = null;
                    sendTo(conn, {
                        type: "leave"
                    });
                }
            }
        }
    });
});

function sendTo(conn, message) {
    conn.send(JSON.stringify(message));
}

wss.on("listening", () => {
    console.log("Server started...");
});

serv.listen(8888);
