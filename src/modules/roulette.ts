import { BotModule, ModuleHandler } from "../command";
import { Client, User, GuildMember, TextChannel, Message } from "discord.js";
import { validateNumber, asyncSleep, randomChoice } from "../utils";

class RouletteGame {
  private gameMessage: Message;
  private participants: { [index: string]: GuildMember } = {};
  private deathMessages: string[] = [
    "# is in a better place now...",
    "# is sleeping with the fishes",
    "# heeft de big RIP",
    "# got rekt"
  ];
  private async shoot(victim: GuildMember) {
    await this.channel.send(
      randomChoice(this.deathMessages).replace("#", victim.displayName)
    );
    await victim.setVoiceChannel(null);
  }

  public async addParticipant(participant: GuildMember | User) {
    if (participant instanceof User)
      participant = await this.gameMessage.guild.fetchMember(participant);
    this.participants[participant.displayName] = participant;
  }
  public listParticipants() {
    let msg = "";
    for (const p of Object.values(this.participants)) {
      msg += "\n" + p.displayName;
    }
    return msg;
  }
  public async start(waitFor: number) {
    // this.addParticipant(this.creator);
    this.gameMessage = (await this.channel.send(
      `${
        this.creator.displayName
      } started a game of Russian roulette. Leave an emoji reaction on this message to participate. Best of luck...\n
      Game starts in ${waitFor} second(s)\n
      Participants: ${this.listParticipants()}`
    )) as Message;
    while (waitFor > 0) {
      await asyncSleep(1000);
      await this.gameMessage.edit(
        this.gameMessage.content.replace(
          /Game starts in \d+/,
          `Game starts in ${--waitFor}`
        )
      );
      let newParticipants = this.gameMessage.reactions.reduce(
        (acc: { [index: string]: User }, reaction) => {
          for (const user of reaction.users.values()) acc[user.username] = user;
          return acc;
        },
        {}
      );
      if (
        // If the newParticipants list has a key that is NOT in the current participants list, add them
        Object.keys(newParticipants).some(
          p => !Object.keys(this.participants).includes(p)
        )
      ) {
        for (const p of Object.values(newParticipants)) {
          await this.addParticipant(p);
        }
        await this.gameMessage.edit(
          this.gameMessage.content.replace(
            /Participants:.*/,
            `Participants:${this.listParticipants()}`
          )
        );
      }
    }
    if (Object.keys(this.participants).length < 2)
      this.channel.send("Game cancelled. Needs at least two participants.");
    else {
      let choice = randomChoice(Object.keys(this.participants));
      await this.shoot(this.participants[choice]);
    }
  }
  constructor(private channel: TextChannel, private creator: GuildMember) {}
}

export class RussianRoulette extends BotModule {
  private defaultWait = 10;
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: async ({ user, server, messageChannel, args }) => {
        if (!(messageChannel instanceof TextChannel)) {
          return "This function only works in server message channels";
        }
        this.makeRoulette(
          await server.fetchMember(user),
          messageChannel,
          validateNumber(args[0], [10, 30], "time") || this.defaultWait
        );
      },
      description: `Start a round of Russian roulette. Starts in ${this.defaultWait} seconds by default.`,
      params: [{ name: "Time till start", optional: true }]
    },
    start: {
      action: ({ user }) => {
        return null;
      },
      description: "Start your roulette game right now",
      params: null
    }
  };
  constructor(protected prefix: string, protected _client: Client) {
    super();
  }
  protected _name = "roulette";
  public info() {
    return "Start a fun round of Russian roulette. The loser gets yeeted out of the server.";
  }
  private rouletteGames: { [index: string]: RouletteGame } = {};

  private async makeRoulette(
    user: GuildMember,
    channel: TextChannel,
    waitFor: number
  ) {
    if (Object.keys(this.rouletteGames).includes(user.id))
      return "You already have an active roulette game. Wait for it to finish before making another one.";
    this.rouletteGames[user.id] = new RouletteGame(channel, user);
    await this.rouletteGames[user.id].start(waitFor);
  }
}
