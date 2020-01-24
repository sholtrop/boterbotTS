import { BotModule, ModuleResponse, ModuleHandler } from "../command";
import { User, Client } from "discord.js";
import { QuoteStore } from "../database/schema";
import { capitalize } from "../utils";
import * as moment from "moment";

interface UserQuote {
  quote: string;
  name?: string;
  createdAt?: Date;
  addedBy?: string;
}

class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: (user, server, name, number) => {
        return this.displayQuote(server.id, name, number);
      },
      params: [
        ["name", false],
        ["quote number", false]
      ],
      description:
        "Display a random quote, or display a random / the [number]th from [name]"
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
      action: (user, server, name) => {
        if (name) return this.displayAllQuotes(server.id, name);
        return this.displayNames(server.id);
      },
      params: [["user", false]],
      description:
        "Display all users with quote count, or display all quotes of [user]"
    }
  };
  protected _name = "quote";

  public info(): string {
    return "Manage and display dank quotes from your friends";
  }

  constructor(protected prefix: string, protected client: Client) {
    super();
  }
  private _dateFormat = "MMMM Do, Y";
  private beautifyQuote(q: UserQuote, number?: number): string {
    const { quote, name, createdAt, addedBy } = q;

    let beautified = number ? `> ${number}. _${quote}_\n` : `> _${quote}_\n`;
    if (name)
      if (createdAt)
        beautified += `- ${name},\n${moment(createdAt).format(
          this._dateFormat
        )}`;
      else beautified += `- ${name}`;
    if (addedBy) beautified += `\n_Added by ${addedBy}_`;
    return beautified;
  }
  private async addQuote(
    requester: User,
    serverID: string,
    name: string,
    quote: string
  ): Promise<ModuleResponse> {
    if (!name) return "Missing <name>, try `!quote help new`";
    if (!quote) return "Missing <quote>, try `!quote help new`";
    name = capitalize(name);
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs) qs = await QuoteStore.create({ serverID });
    if (name && !qs.quoteHavers.includes(name))
      return `${name} is not listed as a quoted person. Use \`!quote addname <name>\` to add them first`;
    qs.quotes.push({
      quote: quote,
      quotedPerson: name,
      addedByID: requester.id
    });
    await qs.save();
    return `Successfully added quote for ${name}`;
  }
  private async addName(
    serverID: string,
    name: string
  ): Promise<ModuleResponse> {
    name = capitalize(name);
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs) qs = await QuoteStore.create({ serverID });
    qs.quoteHavers.push(name);
    await qs.save();
    return `Successfully added ${name} to the list of quoted people`;
  }
  private async displayQuote(
    this: Quotes,
    serverID: string,
    name?: string,
    number?: string
  ): Promise<ModuleResponse> {
    name = capitalize(name);
    let quote: UserQuote;
    let userQuotes: UserQuote[];
    let num: number;
    if (number) {
      num = parseInt(number, 10);
      if (isNaN(num)) return `${number} is not a valid number`;
    }
    const qs = await QuoteStore.findOne({ serverID });
    if (!qs) {
      return "This server does not have any quotes yet";
    }
    if (name && !qs.quoteHavers.includes(name))
      return "This person is not registered yet. Add them with `!quote addname <name>`";
    let toMatch: object;
    if (name) toMatch = { "quotes.quotedPerson": name };
    userQuotes = await QuoteStore.aggregate([
      { $match: { toMatch, serverID } },
      { $unwind: "$quotes" },
      {
        $project: {
          _id: 0,
          quote: "$quotes.quote",
          name: "$quotes.quotedPerson",
          createdAt: "$quotes.createdAt",
          addedBy: "$quotes.addedByID"
        }
      }
    ]).exec();
    if (userQuotes.length === 0)
      return "This server does not have any quotes yet";
    if (name && number) quote = userQuotes[num];
    else {
      quote = userQuotes[Math.floor(Math.random() * userQuotes.length)];
    }
    console.log(quote);
    if (quote.addedBy) quote.addedBy = await this.userIDtoName(quote.addedBy);
    return this.beautifyQuote(quote);
  }
  private async displayAllQuotes(serverID: string, name: string) {
    name = capitalize(name);
    const qs = await QuoteStore.findOne({ serverID });
    if (!qs) return "This server does not have any quotes yet";
    if (!qs.quoteHavers.includes(name))
      return "This person is not registered yet. Add them with `!quote addname <name>`";
    let allQuotes: {
      quote: string;
      name: string;
    }[] = await QuoteStore.aggregate([
      { $match: { serverID } },
      { $unwind: "$quotes" },
      {
        $match: { "quotes.quotedPerson": name }
      },
      {
        $project: {
          _id: 0,
          quote: "$quotes.quote"
        }
      }
    ]).exec();
    console.log(allQuotes);
    if (allQuotes.length === 0) {
      return "This user does not have any quotes yet";
    }
    let msg = "";
    let i: number;
    for (i = 0; i < allQuotes.length - 1; i++) {
      msg += this.beautifyQuote(allQuotes[i], i + 1);
    }
    const lastQuote = allQuotes[i];
    lastQuote.name = name;
    msg += this.beautifyQuote(lastQuote, i + 1);
    return msg;
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
