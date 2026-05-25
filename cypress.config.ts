import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4173",
    supportFile: "cypress/support/e2e.{js,jsx,ts,tsx}",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: false,
  },
});
