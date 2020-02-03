import { BotConfig } from "./bot";
import { allModules } from "./modules";
const PREFIX = "!";

export const config: BotConfig = {
  token: process.env.BOT_TOKEN,
  prefix: PREFIX,
  modules: allModules(PREFIX)
};
