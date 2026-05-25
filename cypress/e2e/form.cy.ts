/// <reference types="cypress" />

describe("Lead Form", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.visit("/");
    cy.get("#formulario").scrollIntoView().should("be.visible");
  });

  it("loads the form", () => {
    cy.get("form").should("exist");
    cy.get('input[placeholder="Tu nombre completo"]').should("be.visible");
    cy.get('input[placeholder="55 1234 5678"]').should("be.visible");
    cy.get('input[placeholder="tu@email.com"]').should("be.visible");
    cy.contains("button", "Quiero informacion").should("be.visible");
  });

  it("submit button is enabled by default", () => {
    cy.contains("button", "Quiero informacion").should("be.enabled");
  });

  it("precargar demo fills fields", () => {
    cy.contains("button", "Precargar demo").click();
    cy.get('input[placeholder="Tu nombre completo"]').should("have.value", "Angel Zorrilla");
    cy.get('input[placeholder="55 1234 5678"]').should("have.value", "9512103083");
    cy.get('input[placeholder="tu@email.com"]').should("have.value", "whoangel.agl@gmail.com");
    cy.get("select").last().should("have.value", "En 1 a 3 meses");
  });

  it("can type in all input fields without freezing", () => {
    cy.get('input[placeholder="Tu nombre completo"]').type("Test User");
    cy.get('input[placeholder="Tu nombre completo"]').should("have.value", "Test User");
    cy.get('input[placeholder="55 1234 5678"]').type("5512345678");
    cy.get('input[placeholder="55 1234 5678"]').should("have.value", "5512345678");
    cy.get('input[placeholder="tu@email.com"]').type("test@test.com");
    cy.get('input[placeholder="tu@email.com"]').should("have.value", "test@test.com");
    cy.get("select").last().select("Este mes");
    cy.get("select").last().should("have.value", "Este mes");
  });

  it("shows validation errors on empty submit", () => {
    cy.contains("button", "Quiero informacion").click({ force: true });
    cy.contains("El nombre debe tener al menos 2 caracteres", { timeout: 5000 }).should(
      "be.visible",
    );
  });

  it("submits the form and shows success", () => {
    cy.contains("button", "Precargar demo").click();
    cy.intercept("POST", "**/9naat1jo6cw0bqqlheau4ylgih331jky", { body: "ok", statusCode: 200 }).as(
      "submitForm",
    );
    cy.contains("button", "Quiero informacion").click({ force: true });
    cy.wait("@submitForm", { timeout: 10000 });
    cy.contains("Listo. Te contactamos pronto").should("be.visible");
  });
});
