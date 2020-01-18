import { BotModule, ModuleHandlers, ModuleResponse } from "../command";

class Quotes extends BotModule {
  protected handlers: ModuleHandlers = {
    add: this.addQuote,
    new: this.addQuote,
    adduser: this.addUser,
    newuser: this.addUser
  };
  protected _name = "quote";

  public info() {
    return "info";
  }
  protected help(target: string) {
    return "None";
  }

  private addQuote() {
    return "quote";
  }
  private addUser() {
    return "something";
  }
}

const quote = new Quotes();
export default quote;
