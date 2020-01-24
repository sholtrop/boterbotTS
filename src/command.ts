import { Guild, User, Client } from "discord.js";

export interface Command {
  method: string;
  args: Array<string>;
  serverID: Guild;
  requester: User;
}

// More to follow
export type ModuleResponse = string;

// [nameOfArg, optional?]
export type HandlerParams = [string, boolean][];

export type HandlerAction = (
  user: User,
  server: Guild,
  ...args: string[]
) => ModuleResponse | Promise<ModuleResponse>;
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
  private readonly helpWidth = 42;
  protected abstract readonly prefix: string;
  protected abstract handlers: { [index: string]: ModuleHandler };

  protected async userIDtoName(this: BotModule, userid: string) {
    const user = await this.client.fetchUser(userid);
    return user.username;
  }
  private handlerToInfo(cmd: string): string {
    let info = "";
    const handler = this.handlers[cmd];
    let cmdInfo = this.prefix + this._name + " " + cmd;
    if (cmd !== "") cmdInfo += " ";
    for (const arg of handler.params) {
      // optional
      if (arg[1]) cmdInfo += "[" + arg[0] + "]";
      // required
      else cmdInfo += "<" + arg[0] + ">";
      cmdInfo += " ";
    }
    info +=
      cmdInfo +
      " ".repeat(this.helpWidth - cmdInfo.length) +
      handler.description;
    return info;
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

  public async execute(cmd: Command): Promise<ModuleResponse> {
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
        return ``;
      }
    }
    // Call relevant handler
    return await this.handlers[cmd.method].action(
      cmd.requester,
      cmd.serverID,
      ...cmd.args
    );
  }
}