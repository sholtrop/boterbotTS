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
    "# got rekt",
    "BOOM! There goes #",
    "Sayonara #"
  ];
  private async shoot(victim: GuildMember) {
    await victim.setVoiceChannel(null);
    await this.channel.send(
      randomChoice(this.deathMessages).replace("#", victim.displayName)
    );
  }
  public async addParticipant(
    participant: GuildMember | User
  ): Promise<boolean> {
    if (participant instanceof User) {
      if (Object.keys(this.participants).includes(participant.username))
        return false;
      participant = await this.gameMessage.guild.fetchMember(participant);
    } else if (Object.keys(this.participants).includes(participant.displayName))
      return false;
    this.participants[participant.user.username] = participant;
    return true;
  }
  public listParticipants(): string {
    let msg = "";
    for (const p of Object.values(this.participants)) {
      msg += "\n" + p.displayName;
    }
    console.log(msg);
    return msg;
  }
  public async start(waitFor: number) {
    this.gameMessage = (await this.channel.send(
      `${this.creator.displayName} started a game of Russian roulette. Leave an emoji reaction on this message to participate. Best of luck...\n` +
        `Game starts in ${waitFor} second(s)\n` +
        `Participants:${this.listParticipants()}`
    )) as Message;
    const collector = this.gameMessage.createReactionCollector(() => true);
    while (waitFor > 0) {
      await asyncSleep(1000);
      await this.gameMessage.edit(
        this.gameMessage.content.replace(
          /Game starts in \d+/,
          `Game starts in ${--waitFor}`
        )
      );
      for (const u of collector.users.values()) {
        // if a user was successfully added, update the message
        if (await this.addParticipant(u))
          await this.gameMessage.edit(
            this.gameMessage.content
              .split("\n")
              .slice(0, 5)
              .join("\n") + this.listParticipants()
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
          return {
            message: "This function only works in server message channels"
          };
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
  constructor(protected prefix: string, protected client: Client) {
    super();
  }
  protected _name = "roulette";
  public info() {
    return "Start a fun round of Russian roulette. The loser gets yeeted out of the server.";
  }
  private currentGame: RouletteGame = null;

  private async makeRoulette(
    user: GuildMember,
    channel: TextChannel,
    waitFor: number
  ) {
    if (this.currentGame !== null)
      return "There is already an active roulette game. Wait for it to finish before making another one.";
    this.currentGame = new RouletteGame(channel, user);
    await this.currentGame.start(waitFor);
    this.currentGame = null;
  }
}
