import { BotModule, ModuleResponse, ModuleHandler } from "../command";
import { readFile } from "fs";
class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: () => {
        return this.displayQuote(true);
      },
      params: [
        ["name", true],
        ["quote number", true]
      ],
      description: "Display a random quote"
    },
    new: {
      action: this.addQuote,
      params: [
        ["name", false],
        ["quote", false]
      ],
      description: "Adds <quote> to <name> as a quote"
    },
    addname: {
      action: this.addName,
      params: [["name", false]],
      description: "Adds <name> to the list of quote-havers"
    }
  };
  protected _name = "quote";

  constructor(protected prefix: string) {
    super();
  }

  public info(): string {
    return "Manage and display dank quotes from your friends";
  }
  private addQuote(): ModuleResponse {
    return "quote";
  }
  private addName(): ModuleResponse {
    return "something";
  }
  private displayQuote(random: boolean): ModuleResponse {
    return "something";
  }
}
export default Quotes;
