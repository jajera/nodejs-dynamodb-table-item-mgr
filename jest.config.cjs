const { defaults } = require("jest-config");

module.exports = {
  // Specify the file extensions Jest should handle
  moduleFileExtensions: [...defaults.moduleFileExtensions, "mjs"],

  // Use Babel for transforming .mjs files
  transform: {
    "^.+\\.mjs$": "babel-jest",
  },

  // Specify Jest options
  testEnvironment: "node",

  // Specify where Jest should look for tests
  testMatch: ["**/__tests__/**/*.mjs", "**/?(*.)+(spec|test).mjs"],

  transformIgnorePatterns: ["/node_modules/(?!(aws-sdk-client-mock)/)"],

  // Optionally, add any other Jest configuration options you need
};
