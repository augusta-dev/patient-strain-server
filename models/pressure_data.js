const mongoose = require("mongoose");

const pressureSchema = new mongoose.Schema(
	{
		patient_name: { type: String, required: true },
		pressure_values: [
			{
				value: Number,
				date: String,	},
		],
	},
	{ timestamps: true },
);

module.exports = mongoose.models.Patient || mongoose.model("Patient", pressureSchema);
