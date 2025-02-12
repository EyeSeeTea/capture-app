import '../sharedSteps';
import '../WidgetTab';

beforeEach(() => {
    cy.loginThroughForm();
});

Then('you choose a schedule date', () => {
    cy.get('[data-test="schedule-section"]').within(() => {
        cy.get("[data-test='capture-ui-input']").eq(0).should('have.value', '2022-08-01');
        cy.get("[data-test='capture-ui-input']").eq(0)
            .clear()
            .type('2023-08-01')
            .blur();
    });
});

When('you click cancel in Schedule tab', () => {
    cy.get('[data-test="dhis2-uicore-button"]').contains('Cancel').click();
});

Then('you should see confirm dialog', () => {
    cy.get('[role="dialog"]')
        .find('[data-test="dhis2-uicore-modaltitle"]')
        .contains('Unsaved changes')
        .should('exist');

    cy.get('[role="dialog"]')
        .find('[data-test="dhis2-uicore-button"]')
        .contains('Yes, discard').click({ force: true }); // Add {force:true} to disable the error due to layer parent has css display: none
});

