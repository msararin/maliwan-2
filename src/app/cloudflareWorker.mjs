import worker from "./worker.js";

const { handleHttpRequest } = worker;

export default {
  fetch(request, env = {}) {
    return handleHttpRequest(request, {
      dataEnvironment: env.MALIWAN_DATA_ENV || "staging",
      d1Database: env.DB || null,
    });
  },
};
