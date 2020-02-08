import { Message, Client, Util } from "discord.js";
import { AnyTextChannel, BotConfig, ExecuteError, Command } from "./types";
import { SoundPlayer, Sound } from "./soundPlayer";
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
    help: this.giveFullBotInfo,
    stop: () => {
      this.player.stop();
      return "Stopped";
    },
    skip: () => {
      this.player.skip();
      return "Skipped";
    }
  };
  private readonly player: SoundPlayer;
  private readonly token: string;
  private readonly prefix: string;
  private modules: {
    [index: string]: BotModule;
  } = {};
  constructor(config: BotConfig) {
    this.client = client;
    this.token = config.token;
    this.prefix = config.prefix;
    this.player = new SoundPlayer();
    for (const mod of config.modules) {
      if (Object.keys(this.botMethods).includes(mod.name)) {
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
    const [target, cmd] = this.parseMessage(msg);
    let response: string;
    if (cmd === null) {
      response = `I don't know what \`${this.prefix + target}\` means. Try \`${
        this.prefix
      }help\` to see what I can do.`;
    } else if (target === "self") {
      response = this.botMethods[cmd.method].call(this, cmd.args);
    } else {
      try {
        response = await this.modules[target].execute(cmd);
      } catch (error) {
        const err: ExecuteError = error;
        response = err.messageToUser;
        console.error(error);
      }
    }
    this.handleResponse(msg.channel, response);
  }

  private parseMessage(this: BoterBot, msg: Message): [string, Command] {
    let cmd: Command;
    let target: string;
    let message: Array<string> = Util.escapeMarkdown(msg.content)
      .trim()
      .substr(this.prefix.length)
      .split(" ");
    message = message.filter(val => val !== "");
    target = message[0];
    console.log("Received:", message);
    // Target is not a module method, but a bot default method, e.g. '!info'.
    if (message.length === 1 && this.botMethods[target]) {
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
    if (cmd) {
      cmd.serverID = msg.guild;
      cmd.requester = msg.author;
    }
    return [target, cmd];
  }

  private handleResponse(channel: AnyTextChannel, response: string): string {
    if (response !== null) channel.send(response);
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
