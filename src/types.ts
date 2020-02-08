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
  path: string;
  volume: number;
  name: string;
}

export interface Command {
  method: string;
  args: Array<string>;
  serverID: Guild;
  requester: User;
}

export interface ExecuteError {
  messageToUser: string;
}

// [nameOfArg, optional?]
export type HandlerParams = { name: string; optional: boolean }[];

export type HandlerAction = (
  user: User,
  server: Guild,
  ...args: string[]
) => string | Promise<string>;

export interface BotConfig {
  token: string;
  prefix: string;
  modules: Array<BotModule>;
}
