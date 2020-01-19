import { BotModule } from "../command";
import Quotes from "./quotes";

export const allModules = (prefix: string) => {
  return [new Quotes(prefix)];
};
