function createCareOrchestrator() {
  return {
    name: "care-orchestrator",
    plan() {
      return {
        status: "skeleton",
        scope: "standalone repo bootstrap",
      };
    },
  };
}

module.exports = {
  createCareOrchestrator,
};
