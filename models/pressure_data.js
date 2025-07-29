const mongoose = require("mongoose");
const patientSchema = new mongoose.Schema(
	{ patient_name: String, pressure_values: Array },
	{ timestamps: true },
);

const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);
module.exports = Patient;