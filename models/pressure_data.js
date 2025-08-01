const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
	{ patient_name: String, pressure_values: Array },
	{ timestamps: true },
);

module.exports =
	mongoose.models.Patient || mongoose.model("Patient", patientSchema);
