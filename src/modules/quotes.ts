import { BotModule, ModuleResponse, ModuleHandler } from "../command";
import { User, Guild } from "discord.js";
import { QuoteStore, QuoteStoreDoc } from "../database/schema";
import { Document } from "mongoose";
class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: this.displayQuote,
      params: [
        ["name", false],
        ["quote number", false]
      ],
      description:
        "Display a random quote (if no name is given). Else, display a random quote from [name], or the [quote number]th quote if given."
    },
    new: {
      action: (a, b, ...args) => {
        return this.addQuote(a, b, args[0], args.slice(1).join(" "));
      },
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
  private async addQuote(
    requester: User,
    server: Guild,
    name: string,
    quote: string
  ): Promise<ModuleResponse> {
    console.log(
      "called addquote with",
      requester.username,
      server.name,
      name,
      quote
    );
    if (!name) return "Missing <name>, try `!quote help new`";
    if (!quote) return "Missing <quote>, try `!quote help new`";
    let qs = await QuoteStore.findOne({ serverID: server.id });
    if (!qs) qs = await QuoteStore.create({ serverID: server.id });
    qs.quotes.push({
      quote: quote,
      quotedPerson: name,
      addedBy: requester.id
    });
    await qs.save();
    console.log(qs.quotes);
    return `Successfully added quote for ${name}`;
  }
  private addName(): ModuleResponse {
    return "something";
  }
  private async displayQuote(
    requester: User,
    server: Guild,
    name?: string,
    number?: string
  ): Promise<ModuleResponse> {
    console.log("displayQuote called");
    let quote: string;
    let userQuotes: any[];
    let num: number;
    if (number) {
      num = parseInt(number, 10);
      if (isNaN(num)) return `${number} is not a valid number`;
    }
    const qs = await QuoteStore.findOne({ serverID: server.id });
    if (!qs) {
      console.log("no QS");
      return "This server does not have any quotes yet";
    }
    if (name)
      userQuotes = await QuoteStore.aggregate([
        { $match: { "quotes.quotedPerson": name } },
        { $unwind: "$quotes" }
      ]);
    else
      userQuotes = await QuoteStore.aggregate([
        { $unwind: "$quotes" },
        { $project: { quotes: "$quotes" } }
      ]);

    if (userQuotes.length === 0)
      return "This server does not have any quotes yet";
    if (name && number) quote = userQuotes[num].quotes.quote;
    else {
      console.log("Random quote from the server:", userQuotes);
      quote =
        userQuotes[Math.floor(Math.random() * userQuotes.length)].quotes.quote;
    }
    return quote;
  }
}
export default Quotes;
