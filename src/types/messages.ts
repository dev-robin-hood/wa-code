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
  SCAN_RESOURCES = 'SCAN_RESOURCES',
  RESOURCES_FOUND = 'RESOURCES_FOUND',
  START_DOWNLOAD = 'START_DOWNLOAD',
  UPDATE_PROGRESS = 'UPDATE_PROGRESS',
  DOWNLOAD_COMPLETE = 'DOWNLOAD_COMPLETE',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  FILE_STATUS_UPDATE = 'FILE_STATUS_UPDATE',
  OPEN_OPTIONS = 'OPEN_OPTIONS',
}

export type FileStatus = 'downloading' | 'formatting' | 'done' | 'failed';

export interface BaseMessage<T extends MessageAction> {
  readonly action: T;
}

export interface StartDownloadMessage extends BaseMessage<MessageAction.START_DOWNLOAD> {
  readonly shouldFormat: boolean;
}

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

export interface FileStatusUpdateMessage extends BaseMessage<MessageAction.FILE_STATUS_UPDATE> {
  readonly url: string;
  readonly filename: string;
  readonly status: FileStatus;
}

export interface ScanResourcesMessage extends BaseMessage<MessageAction.SCAN_RESOURCES> {}

export interface ResourcesFoundMessage extends BaseMessage<MessageAction.RESOURCES_FOUND> {
  readonly urls: readonly string[];
}

export interface OpenOptionsMessage extends BaseMessage<MessageAction.OPEN_OPTIONS> {
  readonly urls: readonly string[];
}

export type ContentMessage = ScanResourcesMessage | ResourcesFoundMessage;
export type BackgroundMessage = OpenOptionsMessage;

export type PopupMessage =
  | UpdateProgressMessage
  | DownloadCompleteMessage
  | DownloadErrorMessage
  | FileStatusUpdateMessage;

export type ExtensionMessage = ContentMessage | PopupMessage;
