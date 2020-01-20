import { BotModule, ModuleResponse, ModuleHandler } from "../command";
import { User, Guild } from "discord.js";
import { QuoteStore, UserQuoteDoc } from "../database/schema";
import * as moment from "moment";
import * as autobind from "auto-bind";
class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: (user, server, name, number) => {
        return this.displayQuote(user, server.id, name, number);
      },
      params: [
        ["name", false],
        ["quote number", false]
      ],
      description:
        "Display a random quote (if no name is given). Else, display a random quote from [name], or the [quote number]th quote if given."
    },
    new: {
      action: (user, server, ...args) => {
        return this.addQuote(user, server.id, args[0], args.slice(1).join(" "));
      },
      params: [
        ["name", false],
        ["quote", false]
      ],
      description: "Adds <quote> to <name> as a quote"
    },
    addname: {
      action: (user, server, name) => {
        return this.addName(server.id, name);
      },
      params: [["name", false]],
      description: "Adds <name> to the list of quote-havers"
    },
    all: {
      action: (user, server, ...rest) => {
        return this.displayNames(server.id);
      },
      params: [["user", false]],
      description:
        "Display all quotes of [user]. Or, display all quoted people, with respective quote counts."
    }
  };
  protected _name = "quote";

  constructor(protected prefix: string) {
    super();
    autobind(this);
  }
  private _dateFormat = "MMMM Do, Y";
  private beautifyQuote(quote: UserQuoteDoc): string {
    let beautified = `> _${quote.quote}_\n`;
    beautified += `- ${quote.quotedPerson},\n${moment(quote.createdAt).format(
      this._dateFormat
    )}\n`;
    return beautified;
  }
  public info(): string {
    return "Manage and display dank quotes from your friends";
  }
  private async addQuote(
    requester: User,
    serverID: string,
    name: string,
    quote: string
  ): Promise<ModuleResponse> {
    if (!name) return "Missing <name>, try `!quote help new`";
    if (!quote) return "Missing <quote>, try `!quote help new`";
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs) qs = await QuoteStore.create({ serverID });
    if (name && !qs.quoteHavers.includes(name))
      return `${name} is not listed as a quoted person. Use \`!quote addname <name>\` to add them first`;
    qs.quotes.push({
      quote: quote,
      quotedPerson: name,
      addedBy: requester.id
    });
    await qs.save();
    return `Successfully added quote for ${name}`;
  }
  private async addName(
    serverID: string,
    name: string
  ): Promise<ModuleResponse> {
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs) qs = await QuoteStore.create({ serverID });
    qs.quoteHavers.push(name);
    await qs.save();
    return `Successfully added ${name} to the list of quoted people`;
  }
  private async displayQuote(
    this: Quotes,
    requester: User,
    serverID: string,
    name?: string,
    number?: string
  ): Promise<ModuleResponse> {
    console.log("displayQuote called");
    let quote: UserQuoteDoc;
    let userQuotes: any[];
    let num: number;
    if (number) {
      num = parseInt(number, 10);
      if (isNaN(num)) return `${number} is not a valid number`;
    }
    const qs = await QuoteStore.findOne({ serverID });
    if (!qs) {
      return "This server does not have any quotes yet";
    }
    if (name)
      userQuotes = await QuoteStore.aggregate([
        { $match: { "quotes.quotedPerson": name } },
        { $unwind: "$quotes" }
      ]).exec();
    else
      userQuotes = await QuoteStore.aggregate([
        { $unwind: "$quotes" },
        { $project: { quotes: "$quotes" } }
      ]).exec();

    if (userQuotes.length === 0)
      return "This server does not have any quotes yet";
    if (name && number) quote = userQuotes[num].quotes;
    else {
      console.log("Random quote from the server:", userQuotes);
      quote = userQuotes[Math.floor(Math.random() * userQuotes.length)].quotes;
    }

    return this.beautifyQuote(quote);
  }
  private async displayNames(serverID: string) {
    let msg = "";
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs) qs = await QuoteStore.create({ serverID });
    if (qs.quoteHavers.length === 0)
      return "No quoted people for this server yet. Add someone with `!quote addname <name>`";
    let count = await QuoteStore.aggregate([
      { $unwind: "$quotes" },
      { $group: { _id: "$quotes.quotedPerson", count: { $sum: 1 } } }
    ]).exec();
    let temp: { [index: string]: number } = {};
    for (const name of qs.quoteHavers) {
      temp[name] = 0;
    }
    for (const grouping of count) {
      if (Object.keys(temp).includes(grouping._id))
        temp[grouping._id] = grouping.count;
    }
    for (const name of qs.quoteHavers) {
      msg += `${name}: ${temp[name]} quote`;
      if (temp[name] !== 1) msg += "s";
      msg += "\n";
    }
    return msg;
  }
}
export default Quotes;
