type ColorType = "success" | "info" | "error" | "warning" | keyof typeof ANSI_COLORS;

export default function colorLog(message: string, type: ColorType) {
  let color: string;
  let prefix: string;

  switch (type) {
    case "success":
      color = ANSI_COLORS.textGreen;
      prefix = `${ANSI_COLORS.textGreen}✓ ${ANSI_COLORS.reset}`;
      break;
    case "info":
      color = ANSI_COLORS.textBlue;
      prefix = `${ANSI_COLORS.textCyan}ℹ ${ANSI_COLORS.reset}`;
      break;
    case "error":
      color = ANSI_COLORS.textRed;
      prefix = `${ANSI_COLORS.textRed}✖ ${ANSI_COLORS.reset}`;
      break;
    case "warning":
      color = ANSI_COLORS.textYellow;
      prefix = `${ANSI_COLORS.textYellow}⚠ ${ANSI_COLORS.reset}`;
      break;
    default:
      color = ANSI_COLORS[type];
      break;
  }

  switch (type) {
    case "error":
      console.error(`${prefix}${color}${message}${ANSI_COLORS.reset}`);
      return;
    case "warning":
      console.warn(`${prefix}${color}${message}${ANSI_COLORS.reset}`);
      return;
    default:
      console.log(`${prefix}${color}${message}${ANSI_COLORS.reset}`);
      return;
  }
}

const ANSI_COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  textBlack: "\x1b[30m",
  textRed: "\x1b[31m",
  textGreen: "\x1b[32m",
  textYellow: "\x1b[33m",
  textBlue: "\x1b[34m",
  textMagenta: "\x1b[35m",
  textCyan: "\x1b[36m",
  textWhite: "\x1b[37m",
  backgroundBlack: "\x1b[40m",
  backgroundRed: "\x1b[41m",
  backgroundGreen: "\x1b[42m",
  backgroundYellow: "\x1b[43m",
  backgroundBlue: "\x1b[44m",
  backgroundMagenta: "\x1b[45m",
  backgroundCyan: "\x1b[46m",
  backgroundWhite: "\x1b[47m",
};
