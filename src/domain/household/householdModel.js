function createHouseholdModel(data = {}) {
  return {
    household_id: data.household_id || null,
    name: data.name || "",
  };
}

module.exports = {
  createHouseholdModel,
};
