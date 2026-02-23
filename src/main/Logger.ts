import log from 'electron-log/main';
import * as path from 'path';
import { app } from 'electron';
import store from './store';

/**
 * 动态配置日志级别
 * @param level 日志级别: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
 */
export function setLogLevel(level: string): void {
  log.transports.file.level = level as any;
  log.transports.console.level = level as any;
  log.info(`Log level set to: ${level}`);
}

/**
 * 初始化日志系统
 * 根据 LOGGING_SYSTEM_PLAN.md 中的规划要求进行配置
 */
export function initializeLogger(): void {
  // 1. 设置统一的日志文件路径
  // 根据规划，所有日志都统一写入 `%APPDATA%/class-sidebar/logs/main.log`
  const logDir = path.join(app.getPath('userData'), 'logs');
  const logFilePath = path.join(logDir, 'main.log');
  
  // 使用 resolvePathFn 自定义日志文件的存储位置
  log.transports.file.resolvePathFn = () => logFilePath;

  // 2. 配置日志格式
  // 目标格式: [时间戳] [级别] [进程名] 内容
  const logFormat = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';
  log.transports.file.format = logFormat;
  log.transports.console.format = logFormat;

  // 3. 配置日志文件最大大小和自动轮转 (Log Rotation)
  // 当日志文件超过 2MB 时，会自动备份为 main.old.log (electron-log 默认行为)
  log.transports.file.maxSize = 2 * 1024 * 1024;

  // 4. 配置各种环境的默认日志级别
  // 在生产环境中，日志级别默认设为 `info`；在开发环境中，级别设为 `debug`。
  const defaultLevel = app.isPackaged ? 'info' : 'debug';
  
  // 获取存储中的自定义日志级别，无配置则使用默认值
  const savedLevel = store.get('logLevel', defaultLevel);
  setLogLevel(savedLevel as string);

  // 5. 自动捕获所有未处理的异常和 Promise rejections
  // 发生未捕获的错误时自动记录到日志中，防止程序静默崩溃
  log.errorHandler.startCatching();

  // 6. 将原生的 console.log 等控制台输出重定向到 electron-log
  Object.assign(console, log.functions);

  // 7. 打印初始化完成日志
  log.info('Logger initialized.');
}

export default log;
