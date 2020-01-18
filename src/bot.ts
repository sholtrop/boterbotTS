import {
  Message,
  Client,
  TextChannel,
  DMChannel,
  GroupDMChannel
} from "discord.js";
import { Command, ModuleResponse, BotModule } from "./command";
const Discord = require("discord.js");

type AnyTextChannel = TextChannel | DMChannel | GroupDMChannel;

// Make a file called config.ts that implements and exports this config
export interface BotConfig {
  token: string;
  prefix: string;
  modules: Array<BotModule>;
}

export class BoterBot {
  private readonly botMethods: { [index: string]: () => string } = {
    info: this.giveFullBotInfo
  };
  private readonly token: string;
  private readonly prefix: string;
  private readonly client: Client;
  private readonly modules: {
    [index: string]: BotModule;
  };
  constructor(config: BotConfig) {
    this.token = config.token;
    this.prefix = config.prefix;
    this.client = new Discord.Client();
    for (const mod of config.modules) {
      this.modules[mod.name] = mod;
    }
  }

  private giveFullBotInfo(): string {
    let info = "`----- BoterBot 2.0 TypeScript edition -----";
    for (const [k, mod] of Object.entries(this.modules)) {
      info += mod.info() + "\n";
    }
    info += "`";
    return info;
  }

  public run(): void {
    this.client.on("ready", () => {
      console.log(`------ Logged in as ${this.client.user.tag} ------`);
    });

    this.client.on("message", (msg: Message) => {
      if (
        msg.author === this.client.user ||
        !msg.content.startsWith(this.prefix)
      ) {
        return;
      }
      const message: Array<string> = msg.content
        .trim()
        .substr(this.prefix.length)
        .toLowerCase()
        .split(" ");
      const target = message[0];
      // Target is not a module method, but a bot default method, e.g. '!info'.
      if (this.botMethods.target) {
        this.handleResponse(msg.channel, this.botMethods.target());
        return;
      }
      const cmd: Command = {
        method: message[1],
        args: message.slice(2)
      };
      const response = this.modules[target].execute(cmd);
      this.handleResponse(msg.channel, response);
    });
    this.client.login(this.token);
  }

  private handleResponse(
    channel: AnyTextChannel,
    response: ModuleResponse
  ): void {
    if (typeof response === "string") channel.send(response);
  }
}
