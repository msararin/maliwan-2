const DATA_ENVIRONMENTS = Object.freeze({
  TEST: "test",
  STAGING: "staging",
  PRODUCTION: "production",
});

const PRODUCTION_NAME_PATTERN = /\b(prod|production)\b/i;

function normalizeDataEnvironment(value = DATA_ENVIRONMENTS.TEST) {
  const normalized = String(value || "").trim().toLowerCase();
  const allowed = Object.values(DATA_ENVIRONMENTS);

  if (!allowed.includes(normalized)) {
    throw new TypeError(`Unsupported Maliwan data environment: ${value}`);
  }

  return normalized;
}

function createDataEnvironmentConfig(input = {}) {
  const dataEnvironment = normalizeDataEnvironment(input.dataEnvironment || process.env.MALIWAN_DATA_ENV || DATA_ENVIRONMENTS.TEST);
  const dataStoreName = String(input.dataStoreName || process.env.MALIWAN_DATA_STORE || `${dataEnvironment}-local`).trim();

  return {
    dataEnvironment,
    dataStoreName,
    isTest: dataEnvironment === DATA_ENVIRONMENTS.TEST,
    isStaging: dataEnvironment === DATA_ENVIRONMENTS.STAGING,
    isProduction: dataEnvironment === DATA_ENVIRONMENTS.PRODUCTION,
  };
}

function assertAutomatedTestDataBoundary(config = {}) {
  const dataEnvironment = normalizeDataEnvironment(config.dataEnvironment || DATA_ENVIRONMENTS.TEST);
  const dataStoreName = String(config.dataStoreName || "").trim();
  const nodeEnvironment = String(config.nodeEnvironment || process.env.NODE_ENV || "").trim().toLowerCase();

  if (nodeEnvironment === DATA_ENVIRONMENTS.TEST && dataEnvironment !== DATA_ENVIRONMENTS.TEST) {
    throw new Error("NODE_ENV=test must not use non-test data environments.");
  }

  if (dataEnvironment !== DATA_ENVIRONMENTS.TEST) {
    throw new Error("Automated tests must use the test data environment.");
  }

  if (PRODUCTION_NAME_PATTERN.test(dataStoreName)) {
    throw new Error("Automated tests must not point at production data stores.");
  }

  return true;
}

module.exports = {
  DATA_ENVIRONMENTS,
  assertAutomatedTestDataBoundary,
  createDataEnvironmentConfig,
  normalizeDataEnvironment,
};
