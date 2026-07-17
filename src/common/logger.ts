/**
 * A logging utility class for structured and leveled logging. Supports logging at various levels such as debug, info, warn, and error.
 * Each log level is represented by a unique emoji. Instances of this class can be associated with a specific module for context in log messages.
 *
 * @class
 * @example
 * const appLogger = new Logger('Application');
 * appLogger.log('Application started');
 *
 * const userServiceLogger = new Logger('UserService');
 * userServiceLogger.error('Failed to load user data', { userId: 123 });
 */
export class Logger {
  private moduleName?: string;

  /**
   * Creates a new instance of Logger with optional default settings.
   *
   * @param {string} [moduleName] - The default module name to associate with all log messages.
   */
  constructor(moduleName?: string) {
    this.moduleName = (moduleName ?? "").padEnd(23, " ");
  }

  /**
   * Formats a log message with the log level emoji, module name (if provided), and the message.
   *
   * @private
   * @param {string} level - The emoji representing the log level.
   * @param {string} message - The primary log message.
   * @returns {string} The formatted log message.
   */
  private formatMessage(level: string, message: string): string {
    return `[${level}${String(this.moduleName)}] - ${message}`;
  }

  /**
   * Logs a general message with optional data. This is the basic form of logging.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.log('Application started');
   * logger.log('User data loaded', { userId: 123 });
   * logger.log('User data loaded', { userId: 123 }, userName: 'Alice');
   *
   */
  log(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage("📗", message), ...args);
  }

  /**
   * Logs a soft warning message with optional data. Unlike a regular warning, this warning uses console.log instead of console.warn.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.warn('User data not found', { userId: 123 });
   * logger.warn('User data not found', { userId: 123 }, userName: 'Alice');
   *
   */
  softWarn(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage("📙", message), ...args);
  }

  /**
   * Logs a warning message with optional data. This is useful for logging non-fatal issues.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.warn('User data not found', { userId: 123 });
   * logger.warn('User data not found', { userId: 123 }, userName: 'Alice');
   *
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage("📙", message), ...args);
  }

  /**
   * Logs an error message with optional data. This is useful for logging fatal issues.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.error('Failed to load user data', { userId: 123 });
   * logger.error('Failed to load user data', { userId: 123 }, userName: 'Alice');
   *
   */
  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage("📕", message), ...args);
  }

  /**
   * Logs an informational message with optional data. This is useful for logging general information.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.info('User data loaded', { userId: 123 });
   * logger.info('User data loaded', { userId: 123 }, userName: 'Alice');
   *
   */
  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage("📘", message), ...args);
  }

  /**
   * Logs a debug message with optional data. This is useful for logging detailed information for debugging purposes.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.debug('User data loaded', { userId: 123 });
   * logger.debug('User data loaded', { userId: 123 }, userName: 'Alice');
   *
   */
  debug(message: string, ...args: unknown[]): void {
    console.debug(this.formatMessage("📓", message), ...args);
  }

  /**
   * Logs a trace message with optional data. This is useful for logging detailed information for debugging purposes.
   *
   * @param {string} message - The primary message to log.
   * @param {unknown[]} args - Optional data to log along with the message, such as objects or other values.
   * @returns {void}
   *
   * @example
   * logger.trace('User data loaded', { userId: 123 });
   * logger.trace('User data loaded', { userId: 123 }, userName: 'Alice');
   *
   */
  trace(message: string, ...args: unknown[]): void {
    console.trace(this.formatMessage("📚", message), ...args);
  }

  time(label: string): void {
    console.time(this.formatMessage("⏱️", label));
  }

  timeEnd(label: string): void {
    console.timeEnd(this.formatMessage("⏱️", label));
  }
}
