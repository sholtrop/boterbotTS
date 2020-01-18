export interface Command {
  method: string;
  args: Array<string>;
}

export type ModuleResponse = string;

export interface ModuleHandlers {
  [index: string]: (...args: string[]) => ModuleResponse;
}

export abstract class BotModule {
  protected abstract _name: string;
  get name(): string {
    return this._name;
  }
  private prefix: string;
  protected abstract handlers: ModuleHandlers;
  protected abstract help(target?: string): string;
  public abstract info(): string;
  public execute(cmd: Command): ModuleResponse {
    if (cmd.method === "help") {
      let target: string;
      if (this[cmd.args[0]] === undefined) {
        return `${cmd.method} has no functionality called '${cmd.args[0]}'. Try \`${this.prefix}${cmd.method} help\``;
      }
      if (this[cmd.args[0]]) target = cmd.args[0];
      return this.help(target);
    }

    if (this.handlers[cmd.method] === undefined) {
      return this.help();
    }

    // Call relevant handler
    return this.handlers[cmd.method](...cmd.args);
  }
}
