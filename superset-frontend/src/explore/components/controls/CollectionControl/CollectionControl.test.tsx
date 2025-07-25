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
import { render, screen, userEvent } from 'spec/helpers/testing-library';
import CollectionControl from '.';

jest.mock('@superset-ui/chart-controls', () => ({
  InfoTooltip: (props: any) => (
    <button
      onClick={props.onClick}
      type="button"
      data-icon={props.icon}
      data-tooltip={props.tooltip}
    >
      {props.label}
    </button>
  ),
}));

jest.mock('..', () => ({
  __esModule: true,
  default: {
    TestControl: (props: any) => (
      <button
        type="button"
        onClick={() => props.onChange(0, 'update')}
        data-test="TestControl"
      >
        TestControl
      </button>
    ),
  },
}));

const createProps = () => ({
  actions: {
    addDangerToast: jest.fn(),
    addInfoToast: jest.fn(),
    addSuccessToast: jest.fn(),
    addWarningToast: jest.fn(),
    createNewSlice: jest.fn(),
    fetchDatasourcesStarted: jest.fn(),
    fetchDatasourcesSucceeded: jest.fn(),
    fetchFaveStar: jest.fn(),
    saveFaveStar: jest.fn(),
    setControlValue: jest.fn(),
    setDatasource: jest.fn(),
    setDatasourceType: jest.fn(),
    setDatasources: jest.fn(),
    setExploreControls: jest.fn(),
    sliceUpdated: jest.fn(),
    toggleFaveStar: jest.fn(),
    updateChartTitle: jest.fn(),
  },
  addTooltip: 'Add an item',
  controlName: 'TestControl',
  description: null,
  hovered: false,
  itemGenerator: jest.fn(),
  keyAccessor: jest.fn(() => 'hrYAZ5iBH'),
  label: 'Time series columns',
  name: 'column_collection',
  onChange: jest.fn(),
  placeholder: 'Empty collection',
  type: 'CollectionControl',
  validationErrors: [],
  validators: [jest.fn()],
  value: [{ key: 'hrYAZ5iBH' }],
});

test('Should render', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);
  expect(await screen.findByTestId('CollectionControl')).toBeInTheDocument();
});

test('Should show the button with the label', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);
  expect(
    await screen.findByRole('button', { name: props.label }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: props.label })).toHaveTextContent(
    props.label,
  );
});

test('Should have add button', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);

  expect(
    await screen.findByRole('button', { name: 'plus' }),
  ).toBeInTheDocument();
  expect(props.onChange).toHaveBeenCalledTimes(0);
  userEvent.click(screen.getByRole('button', { name: 'plus' }));
  expect(props.onChange).toHaveBeenCalledWith([
    { key: 'hrYAZ5iBH' },
    undefined,
  ]);
});

test('Should have remove button', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);

  expect(
    await screen.findByRole('button', { name: 'Show info tooltip' }),
  ).toBeInTheDocument();
  expect(props.onChange).toHaveBeenCalledTimes(0);
  userEvent.click(screen.getByRole('button', { name: 'Show info tooltip' }));
  expect(props.onChange).toHaveBeenCalledWith([]);
});

test('Should have SortableDragger icon', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);
  expect(await screen.findByLabelText('drag')).toBeVisible();
});

test('Should call Control component', async () => {
  const props = createProps();
  render(<CollectionControl {...props} />);

  expect(await screen.findByTestId('TestControl')).toBeInTheDocument();
  expect(props.onChange).toHaveBeenCalledTimes(0);
  userEvent.click(screen.getByTestId('TestControl'));
  expect(props.onChange).toHaveBeenCalledWith([{ key: 'hrYAZ5iBH' }]);
});
