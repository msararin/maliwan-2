function createMedicationModel(data = {}) {
  return {
    medication_name: data.medication_name || "",
    member_id: data.member_id || null,
    household_id: data.household_id || null,
  };
}

module.exports = {
  createMedicationModel,
};
