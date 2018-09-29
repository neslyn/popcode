import test from 'tape';
import tap from 'lodash-es/tap';
import partial from 'lodash-es/partial';
import {Map} from 'immutable';

import reducerTest from '../../helpers/reducerTest';
import reducer from '../../../src/reducers/ui';
import {EditorLocation, Notification, UiState} from '../../../src/records';
import {
  gistNotFound,
  gistImportError,
  updateProjectSource,
  updateProjectInstructions,
} from '../../../src/actions/projects';
import {
  userDoneTyping,
  focusLine,
  editorFocusedRequestedLine,
  notificationTriggered,
  userDismissedNotification,
  toggleTopBarMenu,
  startEditingInstructions,
  cancelEditingInstructions,
  showSaveIndicator,
  hideSaveIndicator,
} from '../../../src/actions/ui';
import {
  snapshotCreated,
  snapshotExportError,
  snapshotImportError,
  snapshotNotFound,
  projectExportNotDisplayed,
  projectExportError,
} from '../../../src/actions/clients';
import {EmptyGistError} from '../../../src/clients/github';
import {
  identityLinked,
  linkGithubIdentity,
  linkIdentityFailed,
  userLoggedOut,
} from '../../../src/actions/user';
import {
  applicationLoaded,
  projectCompiled,
  projectCompilationFailed,
} from '../../../src/actions';

const initialState = new UiState();

function withNotification(type, severity, metadata = {}) {
  return initialState.setIn(
    ['notifications', type],
    new Notification({type, severity, metadata: new Map(metadata)}),
  );
}

const gistId = '12345';

test('startEditingInstructions', reducerTest(
  reducer,
  initialState,
  startEditingInstructions,
  initialState.set('isEditingInstructions', true),
));

test('startEditingInstructions', reducerTest(
  reducer,
  initialState.set('isEditingInstructions', true),
  cancelEditingInstructions,
  initialState,
));

test('updateProjectInstructions', reducerTest(
  reducer,
  initialState.set('isEditingInstructions', true),
  updateProjectInstructions,
  initialState,
));

test('gistNotFound', reducerTest(
  reducer,
  initialState,
  partial(gistNotFound, gistId),
  withNotification('gist-import-not-found', 'error', {gistId}),
));

test('gistImportError', reducerTest(
  reducer,
  initialState,
  partial(gistImportError, gistId),
  withNotification('gist-import-error', 'error', {gistId}),
));

test('updateProjectSource', reducerTest(
  reducer,
  initialState,
  updateProjectSource,
  initialState.set('isTyping', true),
));

test('userDoneTyping', reducerTest(
  reducer,
  initialState.set('isTyping', true),
  userDoneTyping,
  initialState,
));

test('showSaveIndicator', reducerTest(
  reducer,
  initialState,
  showSaveIndicator,
  initialState.set('saveIndicatorShown', true),
));

test('currentProjectSaveFinished', reducerTest(
  reducer,
  initialState,
  hideSaveIndicator,
  initialState.set('saveIndicatorShown', false),
));

test('userLoggedOut', (t) => {
  t.test('with no top bar menu open', reducerTest(
    reducer,
    initialState,
    userLoggedOut,
    initialState,
  ));

  t.test('with currentUser menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'currentUser'),
    userLoggedOut,
    initialState,
  ));

  t.test('with different menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'silly'),
    userLoggedOut,
    initialState.set('openTopBarMenu', 'silly'),
  ));
});

test('linkGithubIdentity', (t) => {
  t.test('with no top bar menu open', reducerTest(
    reducer,
    initialState,
    linkGithubIdentity,
    initialState,
  ));

  t.test('with currentUser menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'currentUser'),
    linkGithubIdentity,
    initialState,
  ));

  t.test('with different menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'silly'),
    linkGithubIdentity,
    initialState.set('openTopBarMenu', 'silly'),
  ));
});

test('identityLinked', reducerTest(
  reducer,
  initialState,
  partial(identityLinked, {providerId: 'github.com'}),
  withNotification('identity-linked', 'notice', {provider: 'github.com'}),
));

test('linkIdentityFailed', reducerTest(
  reducer,
  initialState,
  partial(linkIdentityFailed, new Error()),
  withNotification('link-identity-failed', 'error'),
));

tap({url: 'https://gists.github.com/12345abc', exportType: 'gist'}, (payload) => {
  test('projectExportNotDisplayed', reducerTest(
    reducer,
    initialState,
    partial(projectExportNotDisplayed, payload.url, payload.exportType),
    withNotification(
      'project-export-complete',
      'notice',
      {url: payload.url, exportType: payload.exportType},
    ),
  ));
});

test('projectExportError', (t) => {
  t.test('with generic error', reducerTest(
    reducer,
    initialState,
    partial(projectExportError, 'gist'),
    withNotification('gist-export-error', 'error', {exportType: 'gist'}),
  ));

  t.test('with empty gist error', reducerTest(
    reducer,
    initialState,
    partial(projectExportError, new EmptyGistError()),
    withNotification('empty-gist', 'error'),
  ));
});

test('snapshotExportError', reducerTest(
  reducer,
  initialState,
  partial(snapshotExportError, new Error()),
  withNotification('snapshot-export-error', 'error'),
));

test('snapshotImportError', reducerTest(
  reducer,
  initialState,
  partial(snapshotImportError, new Error()),
  withNotification('snapshot-import-error', 'error'),
));

test('snapshotNotFound', reducerTest(
  reducer,
  initialState,
  snapshotNotFound,
  withNotification('snapshot-not-found', 'error'),
));

test('focusLine', reducerTest(
  reducer,
  initialState,
  partial(focusLine, 'editor.javascript', 4, 2),
  initialState.set(
    'requestedFocusedLine',
    new EditorLocation({component: 'editor.javascript', line: 4, column: 2}),
  ),
));

test('editorFocusedRequestedLine', reducerTest(
  reducer,
  initialState.set(
    'requestedFocusedLine',
    new EditorLocation({component: 'editor.javascript', line: 4, column: 2}),
  ),
  editorFocusedRequestedLine,
  initialState,
));

test('notificationTriggered', (t) => {
  t.test('with no payload', reducerTest(
    reducer,
    initialState,
    partial(notificationTriggered, 'some-error', 'error'),
    withNotification('some-error', 'error'),
  ));

  t.test('with payload', reducerTest(
    reducer,
    initialState,
    partial(notificationTriggered, 'some-error', 'error', {goofy: true}),
    withNotification('some-error', 'error', {goofy: true}),
  ));
});

test('userDismissedNotification', reducerTest(
  reducer,
  withNotification('some-error', 'error'),
  partial(userDismissedNotification, 'some-error'),
  initialState,
));

test('applicationLoaded', (t) => {
  t.test('isExperimental = true', reducerTest(
    reducer,
    initialState,
    partial(applicationLoaded, {gistId: null, isExperimental: true}),
    initialState.set('isExperimental', true),
  ));

  t.test('isExperimental = false', reducerTest(
    reducer,
    initialState,
    partial(applicationLoaded, {gistId: null, isExperimental: false}),
    initialState.set('isExperimental', false),
  ));
});

tap(
  '123-456',
  snapshotKey => test('snapshotCreated', reducerTest(
    reducer,
    initialState,
    partial(snapshotCreated, snapshotKey),
    withNotification('snapshot-created', 'notice', {snapshotKey}),
  )),
);

test('projectCompilationFailed', reducerTest(
  reducer,
  initialState,
  partial(projectCompilationFailed, new Error()),
  withNotification('project-compilation-failed', 'error'),
));

test('projectCompiled', reducerTest(
  reducer,
  withNotification('project-compilation-failed', 'error'),
  partial(projectCompiled, new Error()),
  initialState,
));

test('toggleTopBarMenu', (t) => {
  t.test('with no menu open', reducerTest(
    reducer,
    initialState,
    partial(toggleTopBarMenu, 'silly'),
    initialState.set('openTopBarMenu', 'silly'),
  ));

  t.test('with specified menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'silly'),
    partial(toggleTopBarMenu, 'silly'),
    initialState,
  ));

  t.test('with different menu open', reducerTest(
    reducer,
    initialState.set('openTopBarMenu', 'goofy'),
    partial(toggleTopBarMenu, 'silly'),
    initialState.set('openTopBarMenu', 'silly'),
  ));
});
