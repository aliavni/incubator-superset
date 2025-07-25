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
import { css, styled, t } from '@superset-ui/core';
import { Button, Form } from '@superset-ui/core/components';
import { FC, useEffect, useState } from 'react';
import { MapViewConfigs, MapViewPopoverContentProps } from './types';
import { ControlFormItem } from '../ColumnConfigControl/ControlForm';

export const StyledButtonContainer = styled.div`
  display: flex;
  margin: 8px;
`;

export const StyledControlNumberFormItem = styled(ControlFormItem)`
  ${({ theme }) => css`
    border-radius: ${theme.borderRadius}px;
    width: 100%;
  `}
`;

export const MapViewPopoverContent: FC<MapViewPopoverContentProps> = ({
  onClose = () => {},
  onSave = () => {},
  mapViewConf,
}) => {
  // This is needed to force mounting the form every time
  // we get a new layerConf prop. Otherwise the input fields
  // will not be updated properly, since ControlFormItem only
  // recognises the `value` property once and then handles the
  // values in its on state. Remounting creates a new component
  // and thereby starts with a fresh state.
  const [formKey, setFormKey] = useState<number>(0);

  const [currentMapViewConf, setCurrentMapViewConf] =
    useState<MapViewConfigs>(mapViewConf);

  useEffect(() => {
    setFormKey(oldFormKey => oldFormKey + 1);
    setCurrentMapViewConf({ ...mapViewConf });
  }, [mapViewConf]);

  const onCloseClick = () => {
    // reset form
    setFormKey(oldFormKey => oldFormKey + 1);
    setCurrentMapViewConf({ ...mapViewConf });

    onClose();
  };

  const onSaveClick = () => {
    onSave(currentMapViewConf);
  };

  const onZoomChange = (zoom: number) => {
    setCurrentMapViewConf({
      ...currentMapViewConf,
      fixedZoom: zoom,
    });
  };

  const onLatitudeChange = (latitude: number) => {
    setCurrentMapViewConf({
      ...currentMapViewConf,
      fixedLatitude: latitude,
    });
  };

  const onLongitudeChange = (longitude: number) => {
    setCurrentMapViewConf({
      ...currentMapViewConf,
      fixedLongitude: longitude,
    });
  };

  const zoomLabel = t('Zoom');
  const latitudeLabel = t('Latitude');
  const longitudeLabel = t('Longitude');
  const closeButtonText = t('close');
  const saveButtonText = t('save');

  return (
    <div>
      <Form key={JSON.stringify(formKey)}>
        <StyledControlNumberFormItem
          controlType="InputNumber"
          label={zoomLabel}
          value={currentMapViewConf ? currentMapViewConf.fixedZoom : undefined}
          name="zoom"
          description=""
          min={0}
          max={28}
          step={1}
          onChange={onZoomChange}
        />
        <StyledControlNumberFormItem
          controlType="InputNumber"
          label={latitudeLabel}
          value={
            currentMapViewConf ? currentMapViewConf.fixedLatitude : undefined
          }
          name="latitude"
          description=""
          onChange={onLatitudeChange}
          min={-90}
          max={90}
        />
        <StyledControlNumberFormItem
          controlType="InputNumber"
          label={longitudeLabel}
          value={
            currentMapViewConf ? currentMapViewConf.fixedLongitude : undefined
          }
          name="longitude"
          description=""
          onChange={onLongitudeChange}
          min={-180}
          max={180}
        />
        <StyledButtonContainer>
          <Button buttonStyle="secondary" onClick={onCloseClick}>
            {closeButtonText}
          </Button>
          <Button buttonStyle="primary" onClick={onSaveClick}>
            {saveButtonText}
          </Button>
        </StyledButtonContainer>
      </Form>
    </div>
  );
};

export default MapViewPopoverContent;
