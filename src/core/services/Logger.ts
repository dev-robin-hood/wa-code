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

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_STYLES = {
  [LogLevel.DEBUG]: 'color: #888; font-weight: normal',
  [LogLevel.INFO]: 'color: #2196F3; font-weight: bold',
  [LogLevel.WARN]: 'color: #FF9800; font-weight: bold',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold',
};

const LOG_LABELS = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO ',
  [LogLevel.WARN]: 'WARN ',
  [LogLevel.ERROR]: 'ERROR',
};

export class Logger {
  private static minLevel: LogLevel = LogLevel.INFO;

  constructor(private readonly context: string) {}

  static setMinLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < Logger.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const label = LOG_LABELS[level];
    const style = LOG_STYLES[level];

    const formattedMessage = `[${timestamp}] [${label}] [${this.context}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(`%c${formattedMessage}`, style, ...args);
        break;
      case LogLevel.WARN:
        console.warn(`%c${formattedMessage}`, style, ...args);
        break;
      case LogLevel.ERROR:
        console.error(`%c${formattedMessage}`, style, ...args);
        break;
    }
  }
}
