import { BotModule, ModuleHandler } from "../command";
import { User, Client, RichEmbed } from "discord.js";
import {
  QuoteStore,
  QuoteStoreDoc,
  UserQuote,
  UserQuoteDoc
} from "../database/schema";
import { capitalize, validateNumber } from "../utils";
import * as moment from "moment";
import { HandlerResponse } from "../types";
import { isArray } from "util";

export class Quotes extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: ({ server, args }) => {
        return this.displayQuote(server.id, ...args);
      },
      params: [
        { name: "name", optional: true },
        { name: "quote number", optional: true }
      ],
      description:
        "Display a random quote, or display a random / the [number]th from [name]"
    },
    new: {
      action: async ({ user, server, args }) => {
        return {
          message: await this.addQuote(user, server.id, args[0], args[1])
        };
      },
      params: [
        { name: "name", optional: false },
        { name: "quote", optional: false }
      ],
      description: "Adds <quote> to <name> as a quote"
    },
    addname: {
      action: async ({ server, args }) => {
        return { message: await this.addName(server.id, args[0]) };
      },
      params: [{ name: "name", optional: false }],
      description: "Adds <name> to the list of quote-havers"
    },
    removename: {
      action: async ({ server, args }) => {
        return { message: await this.removeName(server.id, args[0]) };
      },
      description: "Removes <name> from the list of quoted people",
      params: [{ name: "name", optional: false }]
    },
    all: {
      action: async ({ server, args }) => {
        const name = args[0];
        if (name) return await this.displayAllQuotes(server.id, name);
        return { message: await this.displayNames(server.id) };
      },
      params: [{ name: "user", optional: true }],
      description:
        "Display all users with quote count, or display all quotes of [user]"
    },
    delete: {
      action: async ({ server, args }) => {
        return { message: await this.deleteQuote(server.id, args[0], args[1]) };
      },
      params: [
        { name: "name", optional: false },
        { name: "number", optional: true }
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

  private beautifyQuote(
    name: string,
    q: UserQuoteDoc | UserQuoteDoc[],
    extraFields = { quoteeName: true, addedBy: true, date: true }
  ): RichEmbed {
    let { quote = null, createdAt = null, addedBy = null } = !isArray(q)
      ? q
      : {};
    if (isArray(q)) {
      quote = q.reduce((acc, curr, idx) => {
        return acc + `${idx + 1}. ${curr.quote}\n`;
      }, "");
    }
    const fields = extraFields.addedBy
      ? [
          {
            name: "Added by",
            value: addedBy,
            inline: true
          }
        ]
      : null;
    const timestamp = extraFields.date ? createdAt : null;
    const author = extraFields.quoteeName
      ? {
          name,
          url: "",
          icon_url: "https://discohook.org/assets/discord-avatar-red.png"
        }
      : null;
    return new RichEmbed({
      description: quote,
      color: 15746887,
      fields,
      author,
      timestamp,
      thumbnail: {
        url: "https://discohook.org/assets/discord-avatar-red.png"
      }
    });
  }
  private async addQuote(
    requester: User,
    serverID: string,
    name: string,
    quote: string
  ): Promise<string> {
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
  private async addName(serverID: string, name: string): Promise<string> {
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
  ): Promise<HandlerResponse> {
    name = capitalize(name);
    let quoteChoice: UserQuoteDoc;
    let userQuotes: UserQuoteDoc[];
    let num: number = validateNumber(number);
    const qs = await this.getQuoteStore(serverID);

    if (name) {
      if (!this.nameInQuoteHavers(qs, name))
        return {
          message:
            "This person is not registered yet. Add them with `!quote addname <name>`"
        };
      userQuotes = qs.quotes.get(name);
      console.log(qs);
      if (userQuotes.length === 0)
        return { message: "This user does not have any quotes yet" };
    } else {
      let allNames = Array.from(qs.quotes.keys());
      do {
        if (allNames.length === 0)
          return { message: "This server does not have any quotes yet." };
        name = allNames.splice(Math.random() * allNames.length, 1)[0];
      } while (qs.quotes.get(name).length === 0);
      userQuotes = qs.quotes.get(name);
    }
    console.log(userQuotes);
    if (name && num) {
      quoteChoice = userQuotes[num - 1];
      if (quoteChoice === undefined)
        return { message: `Quote with number ${number} does not exist yet.` };
    } else {
      quoteChoice = userQuotes[Math.floor(Math.random() * userQuotes.length)];
    }
    if (quoteChoice.addedBy)
      quoteChoice.addedBy = await this.userIDtoName(quoteChoice.addedBy);
    return { embed: this.beautifyQuote(name, quoteChoice) };
  }
  private async displayAllQuotes(serverID: string, name: string) {
    name = capitalize(name);
    let msg: HandlerResponse = { message: `All quotes for ${name}:\n` };
    const qs = await this.getQuoteStore(serverID);
    if (!qs) return { message: "This server does not have any quotes yet" };
    if (!this.nameInQuoteHavers(qs, name))
      return {
        message:
          "This person is not registered yet. Add them with `!quote addname <name>`"
      };
    if (qs.quotes.get(name).length === 0) {
      return { message: "This user does not have any quotes yet" };
    }
    let allQuotes = qs.quotes.get(name);
    msg.embed = this.beautifyQuote(name, allQuotes, {
      addedBy: false,
      date: false,
      quoteeName: true
    });
    return msg;
  }
  private async displayNames(serverID: string) {
    let msg = "";
    let qs = await this.getQuoteStore(serverID, true);
    if (!qs.quotes || qs.quotes.size === 0)
      return "No quoted people for this server yet. Add someone with `!quote addname <name>`";
    for (const [k, v] of qs.quotes.entries()) {
      msg += `${k}: ${v.length} quote`;
      if (v.length !== 1) msg += "s";
      msg += "\n";
    }
    return msg;
  }
  private async deleteQuote(serverID: string, name: string, number?: string) {
    name = capitalize(name);
    let num: number = validateNumber(number);
    let msg: string;
    console.log(serverID, name, number);
    const qs = await this.getQuoteStore(serverID);
    if (!this.nameInQuoteHavers(qs, name))
      return "This person is not registered yet. Add them with `!quote addname <name>`";
    if (num) {
      qs.quotes.set(name, qs.quotes.get(name).splice(num, 1));
      msg = `Successfully deleted quote #${num} of ${name}`;
    } else {
      qs.quotes.set(name, []);
      msg = `Successfully deleted all of ${name}'s quotes`;
    }
    await qs.save();
    return msg;
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
    return qs as QuoteStoreDoc;
  }
}
