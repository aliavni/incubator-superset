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
import { render } from 'spec/helpers/testing-library';

import mockDatasource from 'spec/fixtures/mockDatasource';
import CollectionTable from './CollectionTable';

const props = {
  collection: mockDatasource['7__table'].columns,
  tableColumns: ['column_name', 'type', 'groupby'],
  sortColumns: [],
};

test('renders a table', () => {
  const { container } = render(<CollectionTable {...props} />);
  const tableBody = container.querySelector('.ant-table-tbody');
  expect(tableBody).toBeInTheDocument();
  const rows = tableBody?.getElementsByTagName('tr');
  expect(rows).toHaveLength(mockDatasource['7__table'].columns.length + 1);
});
