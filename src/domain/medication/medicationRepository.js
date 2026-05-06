function createMedicationRepository() {
  return {
    kind: "repository-interface-placeholder",
    findForMember() {
      return [];
    },
    logTaken() {
      return null;
    },
  };
}

module.exports = {
  createMedicationRepository,
};
