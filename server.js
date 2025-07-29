require("dotenv").config();
const fs = require("fs");
const https = require("https");
const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const Patient = require("./models/pressure_data");

const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB connection using Mongoose
mongoose
	.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("✅ Connected to MongoDB"))
	.catch((err) => console.error("❌ MongoDB connection error:", err));

// Load your SSL certificate and key
const server = https.createServer(
	{
		cert: fs.readFileSync("./cert.pem"), // Your cert file
		key: fs.readFileSync("./key.pem"), // Your private key
	},
	app,
);

// Use middlewares
app.use(cors());
app.use(bodyParser.json());

// Create WSS server on top of HTTPS
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", function connection(ws) {
	console.log("React client connected via WSS");
	clients.push(ws);

	ws.on("close", () => {
		clients = clients.filter((client) => client !== ws);
	});
});

// HTTPS POST endpoint to receive alerts from ESP32
//
app.get("/", (req, res) => {
	res.send("Server is up");
});
app.post("/api/alert", async (req, res) => {
	try {
		const { name, pressure } = req.body;
		console.log(`Received alert from ${name} with force ${pressure}N`);
		console.log("Request body:", req.body);

		// Save to MongoDB
		if (!name || pressure === 0) {
			return res.status(400).json({ message: "Invalid data" });
		}
		const date = new Date();
		await Patient.updateOne(
			{ patient_name: name },
			{
				$push: {
					pressure_values: {
						value: pressure,
						date: date.toString(),
					},
				},
			},
			{ upsert: true },
		);

		// Broadcast to all WSS clients
		clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ name, pressure }));
			}
		});

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error processing alert:", error);
		res.status(500).json({
			success: false,
			error: "Internal Server Error",
		});
	}
});

const PORT = 3000;
server.listen(PORT, () => {
	console.log(`Secure WSS+HTTPS server running at https://localhost:${PORT}`);
});
