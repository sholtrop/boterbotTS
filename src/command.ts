import { Client } from "discord.js";
import { SoundPlayer } from "./soundPlayer";
import { HandlerAction, HandlerParams, Command } from "./types";

export class ModuleHandler {
  action: HandlerAction;
  params?: HandlerParams;
  description: string;
}
export abstract class BotModule {
  protected abstract client: Client;
  protected abstract _name: string;
  get name() {
    return this._name;
  }
  protected _dateFormat = "MMMM Do, Y";
  // helpWidth has a minimum of 40, but is overwritten at startup if there is
  // any handlerInfo string that exceeds 40 characters.
  private helpWidth = 40;
  protected abstract readonly prefix: string;
  protected abstract handlers: { [index: string]: ModuleHandler };

  protected async userIDtoName(this: BotModule, userid: string) {
    const user = await this.client.fetchUser(userid);
    return user.username;
  }
  private handlerToInfo(cmd: string, align = true): string {
    let info = "";
    const handler = this.handlers[cmd];
    let cmdInfo = this.prefix + this._name + " " + cmd;
    if (cmd !== "") cmdInfo += " ";
    if (handler.params) {
      for (const arg of handler.params) {
        // optional
        if (arg.optional) cmdInfo += "[" + arg.name + "]";
        // required
        else cmdInfo += "<" + arg.name + ">";
        cmdInfo += " ";
      }
    }
    if (align)
      info +=
        cmdInfo +
        " ".repeat(this.helpWidth - cmdInfo.length) +
        handler.description;
    else return cmdInfo;
    return info;
  }

  protected initializeHelpWidth(): void {
    let maxLength = 0;
    for (const handler in this.handlers) {
      let info = this.handlerToInfo(handler, false);
      if (info.length > maxLength) maxLength = info.length;
    }
    maxLength += 4;
    if (maxLength > this.helpWidth) this.helpWidth = maxLength;
  }

  public abstract info(): string;

  public help(target?: string): string {
    if (target) {
      return "```" + this.handlerToInfo(target) + "```";
    }
    let info =
      "```\nEverything between <> is required, [] is optional. Cool huh?\n\n";
    for (const cmd in this.handlers) {
      info += this.handlerToInfo(cmd) + "\n";
    }
    return info + "```";
  }

  public verifyParams(cmd: Command): void {
    console.log("Verifying parameters");
    const argc = this.handlers[cmd.method].params?.length;
    if (!this.handlers[cmd.method].params) return;
    let idx = 0;
    if (argc && cmd.args && argc < cmd.args.length)
      throw {
        messageToUser: `Too many arguments. I only need ${argc}. Are you including a sentence as a single argument? Make sure to wrap it in double quotes ("my sentence")`
      };
    for (const param of this.handlers[cmd.method].params) {
      console.log(param, cmd.args[idx]);
      if (!param.optional && !cmd.args[idx]) {
        throw {
          messageToUser:
            `Missing required parameter \`${param.name}\`. Try \`${this.prefix}${this._name} help` +
            (cmd.method === "" ? "`" : `${cmd.method}\``)
        };
      }
      idx++;
    }
  }

  public async execute(cmd: Command): Promise<string> {
    const allHandlers = Object.keys(this.handlers);
    if (cmd.method === "help") {
      if (cmd.args[0] && this.handlers[cmd.args[0]] === undefined) {
        // help arg is non-existent
        return `${this._name} has no functionality called \`${cmd.method}\`. Try \`${this.prefix}${this._name} help\``;
      }
      if (!cmd.args[0]) return this.help();
      return this.help(cmd.args[0]);
    }
    if (cmd.method === undefined || !allHandlers.includes(cmd.method)) {
      // See if it is a valid methodless call
      if (allHandlers.includes("")) {
        cmd.args.splice(0, 0, cmd.method);
        cmd.method = "";
      } else {
        return (
          `\`${this._name}` +
          (cmd.args[0] === undefined
            ? "` needs a command to do something"
            : `\` has no functionality called ${cmd.args[0]}`) +
          `. Try \`${this.prefix}${this._name} help\``
        );
      }
    }
    // Verify whether required parameters are present
    this.verifyParams(cmd);
    // Call relevant handler
    return await this.handlers[cmd.method].action(cmd);
  }
}
