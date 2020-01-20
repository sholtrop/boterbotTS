import {
  Message,
  Client,
  TextChannel,
  DMChannel,
  GroupDMChannel
} from "discord.js";
import { Command, ModuleResponse, BotModule } from "./command";
import * as Discord from "discord.js";

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
      if (Object.keys(this.botMethods).includes(mod.name)) {
        console.error(
          `Error: BotModule ${mod.name} is shadowed by a Bot standard function`
        );
      }
      this.modules[mod.name] = mod;
    }
    console.log("Using modules:", Object.keys(this.modules));
  }

  private giveFullBotInfo(): string {
    let info = "**--------- BoterBot 2.0 TypeScript edition ---------**\n";
    info += "Howdy, I'm the new Boterbot. This is what I can do:\n";
    for (let [k, mod] of Object.entries(this.modules)) {
      info += "`" + this.prefix + mod.name + "` | " + mod.info() + "\n";
    }
    info += "\nUse `!<command> help` to find out how to use them";
    return info;
  }

  private async onMessage(this: BoterBot, msg: Message): Promise<void> {
    if (
      msg.author === this.client.user ||
      !msg.content.startsWith(this.prefix)
    ) {
      return;
    }
    const [target, cmd] = this.parseMessage(msg);
    let response: ModuleResponse;
    if (cmd === null) {
      response = `I don't know what \`${this.prefix + target}\` means. Try \`${
        this.prefix
      }help\` to see what I can do.`;
    } else if (target === "self") {
      response = this.botMethods[cmd.method].call(this, cmd.args);
    } else {
      response = await this.modules[target].execute(cmd);
    }
    this.handleResponse(msg.channel, response);
  }

  private parseMessage(this: BoterBot, msg: Message): [string, Command] {
    let cmd: Command;
    let target: string;
    let message: Array<string> = msg.content
      .trim()
      .substr(this.prefix.length)
      .split(" ");
    message = message.filter(val => val !== "");
    target = message[0];
    console.log("Received:", message);
    // Target is not a module method, but a bot default method, e.g. '!info'.
    if (message.length === 1 && this.botMethods[target]) {
      console.log("self-module");
      target = "self";
      cmd = {
        method: message[0],
        args: message.slice(2),
        serverID: null,
        requester: null
      };
    }
    // No such module
    else if (!Object.keys(this.modules).includes(message[0])) {
      console.log("No such module");
      cmd = null;
    }
    // Successful command
    else {
      console.log("Successful command");
      cmd = {
        method: message[1],
        args: message.slice(2),
        serverID: null,
        requester: null
      };
    }
    cmd.serverID = msg.guild;
    cmd.requester = msg.author;
    return [target, cmd];
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
  ): ModuleResponse {
    console.log("handleResponse called");
    if (typeof response === "string") channel.send(response);
    return response;
  }
}
