import { client } from "../bot";
import Quotes from "./quotes";
import { SoundByte } from "./sound";

export const allModules = (prefix: string) => {
  return [new Quotes(prefix, client), new SoundByte(prefix, client)];
};
