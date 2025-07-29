// server.js
require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Patient = require("./models/pressure_data");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("✅ Connected to MongoDB"))
	.catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// HTTP server for WebSocket upgrade
const server = app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
	console.log("✅ WebSocket client connected");
	clients.push(ws);

	ws.on("close", () => {
		clients = clients.filter((client) => client !== ws);
	});
});

app.get("/", (req, res) => {
	res.send("Server is up and running.");
});

app.post("/api/alert", async (req, res) => {
	try {
		const { name, pressure } = req.body;
		console.log(`Received: ${name} - ${pressure}`);

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
						date: date.toISOString(),
					},
				},
			},
			{ upsert: true },
		);
		console.log("Patient Schema Updated")

		clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ name, pressure }));
			}
		});

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});
