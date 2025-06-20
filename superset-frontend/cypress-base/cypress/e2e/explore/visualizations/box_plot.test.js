/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
describe('Visualization > Box Plot', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/chart/data*').as('getJson');
  });

  const BOX_PLOT_FORM_DATA = {
    datasource: '2__table',
    viz_type: 'box_plot',
    slice_id: 49,
    granularity_sqla: 'year',
    time_grain_sqla: 'P1D',
    time_range: '1960-01-01 : now',
    metrics: ['sum__SP_POP_TOTL'],
    adhoc_filters: [],
    groupby: ['region'],
    limit: '25',
    color_scheme: 'bnbColors',
    whisker_options: 'Min/max (no outliers)',
  };

  function verify(formData) {
    cy.visitChartByParams(formData);
    cy.verifySliceSuccess({ waitAlias: '@getJson' });
  }

  it('should work', () => {
    verify(BOX_PLOT_FORM_DATA);
    cy.get('.chart-container .box_plot canvas').should('have.length', 1);
  });

  it('should allow type to search color schemes', () => {
    verify(BOX_PLOT_FORM_DATA);

    cy.get('#controlSections-tab-CUSTOMIZE').click();
    cy.get('.Control[data-test="color_scheme"]').scrollIntoView();
    cy.get('.Control[data-test="color_scheme"] input[type="search"]').focus();
    cy.focused().type('supersetColors{enter}');
    cy.get(
      '.Control[data-test="color_scheme"] .ant-select-selection-item [data-test="supersetColors"]',
    ).should('exist');
  });
});
