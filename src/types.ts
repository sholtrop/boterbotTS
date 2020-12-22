import {
  TextChannel,
  DMChannel,
  GroupDMChannel,
  Guild,
  User,
  RichEmbed,
  Collection,
  Message,
  Snowflake,
  MessageAttachment,
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
  attachments: Collection<Snowflake, MessageAttachment>;
}

export interface ExecuteError {
  messageToUser: string;
}

export type HandlerParams = { name: string; optional: boolean }[];

export type HandlerResponse = {
  embed?: RichEmbed;
  message?: string;
};

export type HandlerAction = (
  cmd: Command
) => HandlerResponse | Promise<HandlerResponse>;

export interface BotConfig {
  token: string;
  prefix: string;
  modules: Array<BotModule>;
}

export interface MemeTemplateData {
  [index: string]: {
    font: string;
    startFirstX: number;
    startSecondX: number;
    startFirstY: number;
    startSecondY: number;
    endX: number;
    endY: number;
  };
}
