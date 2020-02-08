import {
  TextChannel,
  DMChannel,
  GroupDMChannel,
  Guild,
  User
} from "discord.js";

import { BotModule } from "./command";

export type AnyTextChannel = TextChannel | DMChannel | GroupDMChannel;

export class SoundFile {
  public path: string;
  public volume: number;
  public name: string;
}

export interface Command {
  method: string;
  args: Array<string>;
  server: Guild;
  user: User;
  messageChannel: AnyTextChannel;
}

export interface ExecuteError {
  messageToUser: string;
}

// [nameOfArg, optional?]
export type HandlerParams = { name: string; optional: boolean }[];

export type HandlerAction = (cmd: Command) => string | Promise<string>;

export interface BotConfig {
  token: string;
  prefix: string;
  modules: Array<BotModule>;
}
