export const COMMANDS = ["build", "watch"] as const;
export type Command = (typeof COMMANDS)[number];

export const BROWSERS = ["chrome", "firefox"] as const;
export type Browser = (typeof BROWSERS)[number];

export const ENVIRONMENTS = ["production", "development"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];
