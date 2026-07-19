describe("Navigation", () => {
  it("should navigate to the home page successfully", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
  });
});
