import React from 'react';
import PropTypes from 'prop-types';
import {t} from 'i18next';
import GenericNotificationWithURL from './GenericNotificationWithURL';

export default function GistExportNotification({payload: {url}}) {
  return (
    <GenericNotificationWithURL
      payload={props.payload}
      text={t('notifications.gist-export-complete')}
      type={props.type}
      urlText={t('notifications.gist-export-link')}
    />
  );
}

GistExportNotification.propTypes = {
  payload: PropTypes.object.isRequired,
};
