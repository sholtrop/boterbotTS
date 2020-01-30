import { BotModule, ModuleResponse, ModuleHandler } from "../command";
import { User, Client } from "discord.js";
import {
  QuoteStore,
  QuoteStoreDoc,
  UserQuote,
  UserQuoteDoc
} from "../database/schema";
import { capitalize, randomChoice } from "../utils";
import * as moment from "moment";

class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: (user, server, name, number) => {
        return this.displayQuote(server.id, name, number);
      },
      params: [
        ["name", true],
        ["quote number", true]
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
    removename: {
      action: (user, server, name) => {
        return this.removeName(server.id, name);
      },
      description: "Removes <name> from the list of quoted people",
      params: [["name", false]]
    },
    all: {
      action: (user, server, name) => {
        if (name) return this.displayAllQuotes(server.id, name);
        return this.displayNames(server.id);
      },
      params: [["user", true]],
      description:
        "Display all users with quote count, or display all quotes of [user]"
    },
    delete: {
      action: (user, server, name, number) => {
        return this.deleteQuote(server.id, name, number);
      },
      params: [
        ["name", false],
        ["number", true]
      ],
      description: "Delete all of <name>'s quotes, or only the [number]th quote"
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
  private beautifyQuote(
    name: string,
    q: UserQuoteDoc,
    number?: number
  ): string {
    const { quote, createdAt, addedBy } = q;

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
    name = capitalize(name);
    const qs = await this.getQuoteStore(serverID, true);
    if (!this.nameInQuoteHavers(qs, name))
      return `${name} is not listed as a quoted person. Use \`!quote addname <name>\` to add them first`;
    const newQuotes = qs.quotes.get(name);
    newQuotes.push(
      new UserQuote({
        quote,
        addedBy: requester.id,
        createdAt: new Date()
      }) as UserQuoteDoc
    );
    qs.quotes.set(name, newQuotes);
    await qs.save();
    return `Successfully added quote for ${name}`;
  }
  private async addName(
    serverID: string,
    name: string
  ): Promise<ModuleResponse> {
    name = capitalize(name);
    let qs = await this.getQuoteStore(serverID, true);
    qs.quotes.set(name, []);
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
    let quoteChoice: UserQuoteDoc;
    let userQuotes: UserQuoteDoc[];
    let num: number;
    if (number) {
      num = parseInt(number, 10);
      if (isNaN(num)) return `${number} is not a valid number`;
      if (num === 0)
        return "Quote numbers start from 1 here, you programming nerd.";
    }
    const qs = await this.getQuoteStore(serverID);

    if (name) {
      if (!this.nameInQuoteHavers(qs, name))
        return "This person is not registered yet. Add them with `!quote addname <name>`";
      userQuotes = qs.quotes.get(name);
      console.log(qs);
      if (userQuotes.length === 0)
        return "This user does not have any quotes yet";
    } else {
      let allNames = Array.from(qs.quotes.keys());
      do {
        if (allNames.length === 0)
          return "This server does not have any quotes yet.";
        name = allNames.splice(Math.random() * allNames.length, 1)[0];
      } while (qs.quotes.get(name).length === 0);
      userQuotes = qs.quotes.get(name);
    }
    console.log(userQuotes);
    if (name && num) {
      quoteChoice = userQuotes[num - 1];
      if (quoteChoice === undefined)
        return `Quote with number ${number} does not exist yet.`;
    } else {
      quoteChoice = userQuotes[Math.floor(Math.random() * userQuotes.length)];
    }
    if (quoteChoice.addedBy)
      quoteChoice.addedBy = await this.userIDtoName(quoteChoice.addedBy);
    return this.beautifyQuote(name, quoteChoice);
  }
  private async displayAllQuotes(serverID: string, name: string) {
    name = capitalize(name);
    let msg = "";
    const qs = await this.getQuoteStore(serverID);
    if (!qs) return "This server does not have any quotes yet";
    if (!this.nameInQuoteHavers(qs, name))
      return "This person is not registered yet. Add them with `!quote addname <name>`";
    if (qs.quotes.get(name).length === 0) {
      return "This user does not have any quotes yet";
    }
    let i: number;
    let allQuotes = qs.quotes.get(name);
    for (i = 0; i < allQuotes.length - 1; i++) {
      msg += this.beautifyQuote(name, allQuotes[i], i + 1);
    }
    const lastQuote = allQuotes[i];
    lastQuote.addedBy = null;
    msg += this.beautifyQuote(name, lastQuote, i + 1);
    return msg;
  }
  private async displayNames(serverID: string) {
    let msg = "";
    let qs = await this.getQuoteStore(serverID, true);
    if (!qs.quotes || Object.keys(qs.quotes).length === 0)
      return "No quoted people for this server yet. Add someone with `!quote addname <name>`";
    for (const [k, v] of qs.quotes.entries()) {
      msg += `${k}: ${v.length} quote`;
      if (v.length !== 1) msg += "s";
    }
    return msg;
  }
  private async deleteQuote(serverID: string, name: string, number?: string) {
    name = capitalize(name);
    let num: number;
    if (number) {
      num = parseInt(number, 10);
      if (isNaN(num)) return `${number} is not a valid number`;
      if (num === 0)
        return "Quote numbers start from 1 here, you programming nerd.";
    }
    console.log(serverID, name, number);
    const qs = await this.getQuoteStore(serverID);
    if (!this.nameInQuoteHavers(qs, name))
      return "This person is not registered yet. Add them with `!quote addname <name>`";
    if (num) {
      qs.quotes.get(name).splice(num, 1);
    } else {
      qs.quotes.set(name, []);
    }
    await qs.save();
    return `Successfully deleted all of ${name}'s quotes`;
  }
  private async removeName(serverID: string, name: string) {
    name = capitalize(name);
    const qs = await this.getQuoteStore(serverID);
    if (!this.nameInQuoteHavers(qs, name))
      return `Can't delete that person, as ${name} is not in the list of quoted people`;
    qs.quotes.delete(name);
    await qs.save();
    return `Successfully deleted ${name} from the list`;
  }
  private nameInQuoteHavers(qs: QuoteStoreDoc, name: string): boolean {
    console.log(qs.quotes);
    if (qs.quotes) return qs.quotes.has(name);
    return false;
  }
  private async getQuoteStore(
    serverID: string,
    create = false
  ): Promise<QuoteStoreDoc> {
    let qs = await QuoteStore.findOne({ serverID });
    if (!qs && create) {
      qs = new QuoteStore({ serverID });
      await qs.save();
    } else if (!qs)
      throw { messageToUser: "This server does not have any quotes yet" };
    console.log(qs);
    return qs as QuoteStoreDoc;
  }
}
export default Quotes;
