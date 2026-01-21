import log from "electron-log/main"; // Use 'electron-log/main' for main process
import * as path from "path";
import { app } from "electron";

import store from './store';

export function setLogLevel(level: string): void {
  log.transports.file.level = level as any;
  log.transports.console.level = level as any;
  log.info(`Log level set to: ${level}`);
}

export function initializeLogger(): void {
  // 1. Set log file path
  // By default electron-log writes to app.getPath('userData') / logs / [process type].log
  // We want a specific file 'logs/main.log' for everything if possible, or at least for main.
  // Actually, to have *all* logs (renderer too) go to one file, we might need to configure renderer to send to main,
  // or configure both to write to the same file (and handle potential locking, though electron-log handles this well).
  // The plan says: "All logs ... written to a single file".
  // electron-log v5 handles this.

  const logFilePath = path.join(app.getPath("userData"), "logs", "main.log");
  log.transports.file.resolvePathFn = () => logFilePath;

  // 2. Format
  // [{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}
  log.transports.file.format =
    "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}";
  log.transports.console.format =
    "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}";

  // 3. Size and Rotation
  // 2MB = 2 * 1024 * 1024
  log.transports.file.maxSize = 2 * 1024 * 1024;

  // 4. Levels
  const savedLevel = store.get('logLevel', 'info');
  // If not packaged (dev), prefer 'debug' unless explicitly set to something else?
  // Let's stick to the store value, but default to 'debug' in dev if store is empty?
  // Actually, store has a default schema value 'info'.
  // But strictly, dev environment usually needs debug.
  
  if (!app.isPackaged && savedLevel === 'info') {
      // In dev, if it's default info, maybe we want debug?
      // But user might want to test 'info'.
      // Let's trust the store, but initially set it to debug if it was never set?
      // For now, let's just use the store value.
      setLogLevel(savedLevel);
       // Override for dev console if needed, but let's keep it consistent.
       // Actually, let's allow dev to see everything in console at least?
       // No, keep file/console consistent for now as per previous logic, but driven by store.
  } else {
      setLogLevel(savedLevel);
  }

  // 5. Catch unhandled errors
  log.errorHandler.startCatching();

  // 6. Redirect console
  // electron-log automatically hooks console.log if you don't disable it.
  // But explicitly doing it ensures it's set.
  Object.assign(console, log.functions);

  log.info("Logger initialized.");
}
