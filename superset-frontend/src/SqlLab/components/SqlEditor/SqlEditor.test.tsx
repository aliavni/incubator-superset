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
import { FocusEventHandler } from 'react';
import {
  isFeatureEnabled,
  getExtensionsRegistry,
  FeatureFlag,
} from '@superset-ui/core';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from 'spec/helpers/testing-library';
import fetchMock from 'fetch-mock';
import reducers from 'spec/helpers/reducerIndex';
import { setupStore } from 'src/views/store';
import {
  initialState,
  queries,
  table,
  defaultQueryEditor,
} from 'src/SqlLab/fixtures';
import SqlEditorLeftBar from 'src/SqlLab/components/SqlEditorLeftBar';
import ResultSet from 'src/SqlLab/components/ResultSet';
import { api } from 'src/hooks/apiResources/queryApi';
import setupExtensions from 'src/setup/setupExtensions';
import type { Action, Middleware, Store } from 'redux';
import SqlEditor, { Props } from '.';

jest.mock('@superset-ui/core/components/AsyncAceEditor', () => ({
  ...jest.requireActual('@superset-ui/core/components/AsyncAceEditor'),
  FullSQLEditor: ({
    onChange,
    onBlur,
    value,
  }: {
    onChange: (value: string) => void;
    onBlur: FocusEventHandler<HTMLTextAreaElement>;
    value: string;
  }) => (
    <textarea
      data-test="react-ace"
      onChange={evt => onChange(evt.target.value)}
      onBlur={onBlur}
      value={value}
    />
  ),
}));
jest.mock('src/SqlLab/components/SqlEditorLeftBar', () => jest.fn());
jest.mock('src/SqlLab/components/ResultSet', () => jest.fn());

fetchMock.get('glob:*/api/v1/database/*/function_names/', {
  function_names: [],
});
fetchMock.get('glob:*/api/v1/database/*', { result: [] });
fetchMock.get('glob:*/api/v1/database/*/tables/*', { options: [] });
fetchMock.get('glob:*/tabstateview/*', defaultQueryEditor);
fetchMock.post('glob:*/sqllab/execute/*', { result: [] });

let store: Store;
let actions: Action[];
const latestQuery = {
  ...queries[0],
  sqlEditorId: defaultQueryEditor.id,
};
const mockInitialState = {
  ...initialState,
  sqlLab: {
    ...initialState.sqlLab,
    queries: {
      [latestQuery.id]: { ...latestQuery, startDttm: new Date().getTime() },
    },
    databases: {
      1991: {
        allow_ctas: false,
        allow_cvas: false,
        allow_dml: false,
        allow_file_upload: false,
        allow_run_async: false,
        backend: 'postgresql',
        database_name: 'examples',
        expose_in_sqllab: true,
        force_ctas_schema: null,
        id: 1,
      },
    },
    unsavedQueryEditor: {
      id: defaultQueryEditor.id,
      dbId: 1991,
      latestQueryId: latestQuery.id,
    },
  },
};

jest.mock('@superset-ui/core', () => ({
  ...jest.requireActual('@superset-ui/core'),
  isFeatureEnabled: jest.fn(),
}));
const mockIsFeatureEnabled = isFeatureEnabled as jest.Mock;

const setup = (props: Props, store: Store) =>
  render(<SqlEditor {...props} />, {
    useRedux: true,
    ...(store && { store }),
  });

const logAction: Middleware = () => next => action => {
  if (typeof action === 'function') {
    return next(action);
  }
  actions.push(action);
  return next(action);
};

const createStore = (initState: object) =>
  setupStore({
    disableDebugger: true,
    initialState: initState,
    rootReducers: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(api.middleware, logAction),
  });

describe('SqlEditor', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  afterEach(async () => {
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  const mockedProps = {
    queryEditor: initialState.sqlLab.queryEditors[0],
    tables: [table],
    getHeight: () => '100px',
    editorQueries: [],
    dataPreviewQueries: [],
    defaultQueryLimit: 1000,
    maxRow: 100000,
    displayLimit: 100,
    saveQueryWarning: '',
    scheduleQueryWarning: '',
  };

  beforeEach(() => {
    store = createStore(mockInitialState);
    actions = [];

    (SqlEditorLeftBar as jest.Mock).mockClear();
    (SqlEditorLeftBar as jest.Mock).mockImplementation(() => (
      <div data-test="mock-sql-editor-left-bar" />
    ));
    (ResultSet as unknown as jest.Mock).mockClear();
    (ResultSet as unknown as jest.Mock).mockImplementation(() => (
      <div data-test="mock-result-set" />
    ));
  });

  afterEach(() => {
    act(() => {
      store.dispatch(api.util.resetApiState());
    });
  });

  it('does not render SqlEditor if no db selected', async () => {
    const queryEditor = initialState.sqlLab.queryEditors[2];
    const { findByText } = setup({ ...mockedProps, queryEditor }, store);
    expect(
      await findByText('Select a database to write a query'),
    ).toBeInTheDocument();
  });

  it('renders db unavailable message', async () => {
    const queryEditor = initialState.sqlLab.queryEditors[1];
    const { findByText } = setup({ ...mockedProps, queryEditor }, store);
    expect(
      await findByText(
        'The database that was used to generate this query could not be found',
      ),
    ).toBeInTheDocument();
  });

  it('render a SqlEditorLeftBar', async () => {
    const { getByTestId, unmount } = setup(mockedProps, store);

    await waitFor(
      () => expect(getByTestId('mock-sql-editor-left-bar')).toBeInTheDocument(),
      { timeout: 10000 },
    );

    unmount();
  }, 15000);

  // Update other similar tests with timeouts
  it('render an AceEditorWrapper', async () => {
    const { findByTestId, unmount } = setup(mockedProps, store);

    await waitFor(
      () => expect(findByTestId('react-ace')).resolves.toBeInTheDocument(),
      { timeout: 10000 },
    );

    unmount();
  }, 15000);

  it('skip rendering an AceEditorWrapper when the current tab is inactive', async () => {
    const { findByTestId, queryByTestId } = setup(
      {
        ...mockedProps,
        queryEditor: initialState.sqlLab.queryEditors[1],
      },
      store,
    );
    expect(await findByTestId('mock-sql-editor-left-bar')).toBeInTheDocument();
    expect(queryByTestId('react-ace')).not.toBeInTheDocument();
  });

  it('avoids rerendering EditorLeftBar and ResultSet while typing', async () => {
    const { findByTestId } = setup(mockedProps, store);
    const editor = await findByTestId('react-ace');
    const sql = 'select *';
    const renderCount = (SqlEditorLeftBar as jest.Mock).mock.calls.length;
    const renderCountForSouthPane = (ResultSet as unknown as jest.Mock).mock
      .calls.length;
    expect(SqlEditorLeftBar).toHaveBeenCalledTimes(renderCount);
    expect(ResultSet).toHaveBeenCalledTimes(renderCountForSouthPane);
    fireEvent.change(editor, { target: { value: sql } });
    // Verify the rendering regression
    expect(SqlEditorLeftBar).toHaveBeenCalledTimes(renderCount);
    expect(ResultSet).toHaveBeenCalledTimes(renderCountForSouthPane);
  });

  it('renders sql from unsaved change', async () => {
    const expectedSql = 'SELECT updated_column\nFROM updated_table\nWHERE';
    store = createStore({
      ...initialState,
      sqlLab: {
        ...initialState.sqlLab,
        databases: {
          2023: {
            allow_ctas: false,
            allow_cvas: false,
            allow_dml: false,
            allow_file_upload: false,
            allow_run_async: false,
            backend: 'postgresql',
            database_name: 'examples',
            expose_in_sqllab: true,
            force_ctas_schema: null,
            id: 1,
          },
        },
        unsavedQueryEditor: {
          id: defaultQueryEditor.id,
          dbId: 2023,
          sql: expectedSql,
        },
      },
    });
    const { findByTestId } = setup(mockedProps, store);

    const editor = await findByTestId('react-ace');
    expect(editor).toHaveValue(expectedSql);
  });

  it('render a SouthPane', async () => {
    const { findByTestId } = setup(mockedProps, store);
    expect(await findByTestId('mock-result-set')).toBeInTheDocument();
  });

  it('runs query action with ctas false', async () => {
    store = createStore({
      ...initialState,
      sqlLab: {
        ...initialState.sqlLab,
        databases: {
          5667: {
            allow_ctas: false,
            allow_cvas: false,
            allow_dml: false,
            allow_file_upload: false,
            allow_run_async: true,
            backend: 'postgresql',
            database_name: 'examples',
            expose_in_sqllab: true,
            force_ctas_schema: null,
            id: 1,
          },
        },
        unsavedQueryEditor: {
          id: defaultQueryEditor.id,
          dbId: 5667,
          sql: 'expectedSql',
        },
      },
    });
    const { findByTestId } = setup(mockedProps, store);
    const runButton = await findByTestId('run-query-action');
    fireEvent.click(runButton);
    await waitFor(() =>
      expect(actions).toContainEqual({
        type: 'START_QUERY',
        query: expect.objectContaining({
          ctas: false,
          sqlEditorId: defaultQueryEditor.id,
        }),
      }),
    );
  });

  it('render a Limit Dropdown', async () => {
    const defaultQueryLimit = 101;
    const updatedProps = { ...mockedProps, defaultQueryLimit };
    const { findByText } = setup(updatedProps, store);
    fireEvent.click(await findByText('LIMIT:'));
    expect(await findByText('10 000')).toBeInTheDocument();
  });

  it('renders an Extension if provided', async () => {
    const extensionsRegistry = getExtensionsRegistry();

    extensionsRegistry.set('sqleditor.extension.form', () => (
      <>sqleditor.extension.form extension component</>
    ));

    setupExtensions();
    const { findByText } = setup(mockedProps, store);
    expect(
      await findByText('sqleditor.extension.form extension component'),
    ).toBeInTheDocument();
  });

  describe('with EstimateQueryCost enabled', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockImplementation(
        featureFlag => featureFlag === FeatureFlag.EstimateQueryCost,
      );
    });
    afterEach(() => {
      mockIsFeatureEnabled.mockClear();
    });

    it('sends the catalog and schema to the endpoint', async () => {
      const estimateApi = 'http://localhost/api/v1/sqllab/estimate/';
      fetchMock.post(estimateApi, {});

      store = createStore({
        ...initialState,
        sqlLab: {
          ...initialState.sqlLab,
          databases: {
            2023: {
              allow_ctas: false,
              allow_cvas: false,
              allow_dml: false,
              allow_file_upload: false,
              allow_run_async: false,
              backend: 'postgresql',
              database_name: 'examples',
              expose_in_sqllab: true,
              force_ctas_schema: null,
              id: 1,
              allows_cost_estimate: true,
            },
          },
          unsavedQueryEditor: {
            id: defaultQueryEditor.id,
            dbId: 2023,
            sql: 'SELECT * FROM t',
            schema: 'public',
            catalog: 'prod',
          },
        },
      });
      const { findByText } = setup(mockedProps, store);
      const button = await findByText('Estimate cost');
      expect(button).toBeInTheDocument();

      // click button
      fireEvent.click(button);
      await waitFor(() => {
        expect(fetchMock.lastUrl()).toEqual(estimateApi);
        expect(fetchMock.lastOptions()).toEqual(
          expect.objectContaining({
            body: JSON.stringify({
              database_id: 2023,
              catalog: 'prod',
              schema: 'public',
              sql: 'SELECT * FROM t',
              template_params: {},
            }),
            cache: 'default',
            credentials: 'same-origin',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-CSRFToken': '1234',
            },
            method: 'POST',
            mode: 'same-origin',
            redirect: 'follow',
            signal: undefined,
          }),
        );
      });
    });
  });

  describe('with SqllabBackendPersistence enabled', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockImplementation(
        featureFlag => featureFlag === FeatureFlag.SqllabBackendPersistence,
      );
    });
    afterEach(() => {
      mockIsFeatureEnabled.mockClear();
    });

    it('should render loading state when its Editor is not loaded', async () => {
      const switchTabApi = `glob:*/tabstateview/${defaultQueryEditor.id}/activate`;
      fetchMock.post(switchTabApi, {});
      const { getByTestId } = setup(
        {
          ...mockedProps,
          queryEditor: {
            ...mockedProps.queryEditor,
            loaded: false,
          },
        },
        store,
      );
      const indicator = getByTestId('sqlEditor-loading');
      expect(indicator).toBeInTheDocument();
      await waitFor(() =>
        expect(fetchMock.calls('glob:*/tabstateview/*').length).toBe(1),
      );
      // it will be called from EditorAutoSync
      expect(fetchMock.calls(switchTabApi).length).toBe(0);
    });
  });
});
