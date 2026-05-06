function createD1MedicationRepository() {
  return {
    kind: "d1-repository-placeholder",
    findForMember() {
      return [];
    },
    logTaken() {
      return null;
    },
  };
}

module.exports = {
  createD1MedicationRepository,
};
