import { client } from "../bot";
import Quotes from "./quotes";

export const allModules = (prefix: string) => {
  return [new Quotes(prefix, client)];
};
