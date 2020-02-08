import { BotConfig } from "./types";
import { allModules } from "./modules";
const PREFIX = "!";

export const config: BotConfig = {
  token: process.env.BOT_TOKEN,
  prefix: PREFIX,
  modules: allModules(PREFIX)
};
