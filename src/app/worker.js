function createWorkerHandler() {
  return {
    name: "maliwan-2-worker",
    handle() {
      return {
        status: 200,
        body: "maliwan-2 skeleton",
      };
    },
  };
}

module.exports = {
  createWorkerHandler,
};
