import { Message, Client, Util } from "discord.js";
import { AnyTextChannel, BotConfig, ExecuteError, Command } from "./types";
import { BotModule } from "./command";
import * as Discord from "discord.js";

// Make a file called config.ts that implements and exports this config

export const client = new Discord.Client();

export class BoterBot {
  private readonly client: Client;
  private readonly botMethods: {
    [index: string]: (this: BoterBot) => string;
  } = {
    info: this.giveFullBotInfo,
    help: this.giveFullBotInfo
  };
  private readonly token: string;
  private readonly prefix: string;
  private modules: {
    [index: string]: BotModule;
  } = {};
  constructor(config: BotConfig) {
    this.client = client;
    this.token = config.token;
    this.prefix = config.prefix;
    for (const mod of config.modules) {
      if (mod.name in this.botMethods) {
        console.error(
          `Error: BotModule ${mod.name} is shadowed by a Bot standard function`
        );
        process.exit(-1);
      }
      this.modules[mod.name] = mod;
    }
    console.log("Using modules:", Object.keys(this.modules));
  }

  private giveFullBotInfo(): string {
    let info = "**--------- BoterBot 2.0 TypeScript edition ---------**\n";
    info += "Howdy, I'm the new Boterbot. This is what I can do:\n";
    for (let [k, mod] of Object.entries(this.modules)) {
      info += "`" + this.prefix + mod.name + "` " + mod.info() + "\n";
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
    let response: string;
    try {
      const [target, cmd] = this.parseMessage(msg);
      if (cmd === null) {
        response = `I don't know what \`${this.prefix +
          target}\` means. Try \`${this.prefix}help\` to see what I can do.`;
      } else if (target === "self") {
        response = this.botMethods[cmd.method].call(this, cmd.args);
      } else {
        response = await this.modules[target].execute(cmd);
      }
    } catch (error) {
      const err: ExecuteError = error;
      response = err.messageToUser || "Unknown error :(";
      console.error(error);
    }
    this.handleResponse(msg.channel, response);
  }

  private parseMessage(this: BoterBot, msg: Message): [string, Command] {
    let cmd: Command;
    let target: string;
    let parsed: string[] = [];
    let accum = "";
    let inQuote = false;
    let message: string = Util.escapeMarkdown(msg.content)
      .trim()
      .substr(this.prefix.length);
    for (const i of message) {
      if (i === " " && !inQuote) {
        parsed.push(accum);
        accum = "";
      } else if (i === '"') {
        inQuote = !inQuote;
      } else accum += i;
    }
    if (inQuote)
      throw {
        messageToUser:
          'Parsing error: You have an unclosed quote! Make sure every opening " has a closing " as well!'
      };
    if (accum) parsed.push(accum);

    target = parsed[0];
    console.log("Received:", parsed);
    // Target is not a module method, but a bot default method, e.g. '!info'.
    if (parsed.length === 1 && this.botMethods[target]) {
      target = "self";
      cmd = {
        method: parsed[0],
        args: parsed.slice(2),
        server: null,
        user: null,
        messageChannel: msg.channel
      };
    }
    // No such module
    else if (!(parsed[0] in this.modules)) {
      console.log("No such module");
      cmd = null;
    }
    // Successful command
    else {
      console.log("Successful command");
      cmd = {
        method: parsed[1],
        args: parsed.slice(2),
        server: null,
        user: null,
        messageChannel: msg.channel
      };
    }
    if (cmd) {
      cmd.server = msg.guild;
      cmd.user = msg.author;
    }
    return [target, cmd];
  }

  private handleResponse(channel: AnyTextChannel, response: string): string {
    if (response !== null && response !== undefined) channel.send(response);
    return response;
  }

  public run(): void {
    this.client.on("ready", () => {
      console.log(`------ Logged in as ${this.client.user.username} ------`);
    });

    this.client.on("message", (msg: Message) => this.onMessage(msg));
    this.client.login(this.token).catch(e => console.error(e));
  }
}
