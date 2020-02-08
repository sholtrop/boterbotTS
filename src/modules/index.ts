// Import all the modules, instantiate them and give them to the allModules
// array so the bot can register them

import { client } from "../bot";
import { Quotes } from "./quotes";
import { SoundByte } from "./sound";
import { RussianRoulette } from "./roulette";

export const allModules = (prefix: string) => {
  return [
    new Quotes(prefix, client),
    new SoundByte(prefix, client),
    new RussianRoulette(prefix, client)
  ];
};
