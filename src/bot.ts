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
  private readonly botMethods: {
    [index: string]: (this: BoterBot) => string;
  } = {
    info: this.giveFullBotInfo,
    help: this.giveFullBotInfo
  };
  private readonly token: string;
  private readonly prefix: string;
  private readonly client: Client;
  private modules: {
    [index: string]: BotModule;
  } = {};
  constructor(config: BotConfig) {
    this.token = config.token;
    this.prefix = config.prefix;
    this.client = new Discord.Client();
    for (const mod of config.modules) {
      this.modules[mod.name] = mod;
    }
    console.log("Using modules:", Object.keys(this.modules));
  }

  private giveFullBotInfo(): string {
    let info = "**--------- BoterBot 2.0 TypeScript edition ---------**\n";
    info += "The following commands are available:\n";
    for (let [k, mod] of Object.entries(this.modules)) {
      info += "`" + this.prefix + mod.name + "` | " + mod.info() + "\n";
    }
    info += "\nUse `!<command> help` to find out how to use them";
    return info;
  }

  private onMessage(this: BoterBot, msg: Message) {
    if (
      msg.author === this.client.user ||
      !msg.content.startsWith(this.prefix)
    ) {
      return;
    }
    let message: Array<string> = msg.content
      .trim()
      .substr(this.prefix.length)
      .toLowerCase()
      .split(" ");
    message = message.filter(val => val !== "");
    const target = message[0];
    console.log("Received:", message);
    // Target is not a module method, but a bot default method, e.g. '!info'.
    if (message.length === 1 && this.botMethods[target]) {
      this.handleResponse(msg.channel, this.botMethods[target].call(this));
      return;
    }
    if (!Object.keys(this.modules).includes(message[0])) {
      this.handleResponse(
        msg.channel,
        `Unknown command \`${this.prefix + message[0]}\`. Try \`${
          this.prefix
        }help\``
      );
      return;
    }
    const cmd: Command = {
      method: message[1],
      args: message.slice(2)
    };
    const response = this.modules[target].execute(cmd);
    this.handleResponse(msg.channel, response);
  }

  public run(): void {
    this.client.on("ready", () => {
      console.log(`------ Logged in as ${this.client.user.username} ------`);
    });

    this.client.on("message", (msg: Message) => this.onMessage(msg));
    this.client.login(this.token).catch(e => console.error(e));
  }

  private handleResponse(
    channel: AnyTextChannel,
    response: ModuleResponse
  ): void {
    if (typeof response === "string") channel.send(response);
  }
}
