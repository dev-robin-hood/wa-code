/**
 * Copyright 2025 dev-robin-hood
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const enum MessageAction {
  START_DOWNLOAD = 'START_DOWNLOAD',
  UPDATE_PROGRESS = 'UPDATE_PROGRESS',
  DOWNLOAD_COMPLETE = 'DOWNLOAD_COMPLETE',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
}

export interface BaseMessage<T extends MessageAction> {
  readonly action: T;
}

export interface StartDownloadMessage extends BaseMessage<MessageAction.START_DOWNLOAD> {}

export interface UpdateProgressMessage extends BaseMessage<MessageAction.UPDATE_PROGRESS> {
  readonly current: number;
  readonly total: number;
  readonly success: number;
  readonly errors: number;
  readonly info: string;
}

export interface DownloadCompleteMessage extends BaseMessage<MessageAction.DOWNLOAD_COMPLETE> {
  readonly success: number;
  readonly errors: number;
}

export interface DownloadErrorMessage extends BaseMessage<MessageAction.DOWNLOAD_ERROR> {
  readonly error: string;
}

export type ContentMessage = StartDownloadMessage;

export type PopupMessage =
  | UpdateProgressMessage
  | DownloadCompleteMessage
  | DownloadErrorMessage;

export type ExtensionMessage = ContentMessage | PopupMessage;
