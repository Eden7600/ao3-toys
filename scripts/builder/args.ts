import { parseArgs } from "node:util";
import {
  BROWSERS,
  COMMANDS,
  ENVIRONMENTS,
  type Browser,
  type Command,
  type Environment,
} from "../../src/common/constants";

export type Args = {
  command: Command;
  environment: Environment;
  browser: Browser;
};

export function parseCommandArgs(): Args {
  const { positionals: argv } = parseArgs({ allowPositionals: true });

  process.env.NODE_ENV ??= "production";

  if (argv.length !== 1) throw new Error("Must specify exactly one command");
  if (!COMMANDS.includes(argv[0] as Command))
    throw new Error(`Invalid command: ${argv[0]}`);

  if (!process.env.BROWSER) throw new Error("Must specify a browser");
  if (!BROWSERS.includes(process.env.BROWSER as Browser))
    throw new Error(`Invalid browser: ${process.env.BROWSER}`);

  const environment = process.env.NODE_ENV as Environment;
  if (!ENVIRONMENTS.includes(environment))
    throw new Error(`Invalid environment: ${environment}`);

  return {
    command: argv[0] as Command,
    environment,
    browser: process.env.BROWSER as Browser,
  };
}
