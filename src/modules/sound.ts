import { ModuleHandler } from "../command";
import { SoundModule } from "./_soundModule";
import { Client } from "discord.js";
import {
  SoundStore,
  SoundStoreDoc,
  PlayableSound,
  PlayableSoundProps,
  PlayableSoundDoc
} from "../database/schema";
import * as ytdl from "ytdl-core";
import { hmsToSeconds } from "../utils";
import moment = require("moment");

export class SoundByte extends SoundModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: async (user, server, soundName) => {
        const s = await this.fetchSound(server.id, soundName);
        if (s === null) return `Sound with ${soundName} does not exist`;
        await this.playSound(user.lastMessage.member.voiceChannel, s);
        await this.incrementPlayed(server.id, soundName);
        return null;
      },
      description:
        "Play the sound called <name>, optionally overwriting its volume with [volume]",
      params: [
        ["name", false],
        ["volume", true]
      ]
    },
    new: {
      action: (user, server, link, start, end, soundName, volume?) => {
        return this.addSound(
          server.id,
          user.id,
          soundName,
          link,
          start,
          end,
          volume
        );
      },
      description:
        "Add soundclip from <start> to <end> of the video in <link>. Giving it <name> as a name, and optionally a [volume] from 1-100.",
      params: [
        ["link", false],
        ["start", false],
        ["end", false],
        ["name", false],
        ["volume", true]
      ]
    },
    delete: {
      action: (user, server, soundName) => {
        return this.removeSound(server.id, soundName);
      },
      description: "Remove soundclip with <name> from the list",
      params: [["name", false]]
    },
    list: {
      action: (user, server) => {
        return this.giveSoundList(server.id);
      },
      description: "Give the list of all sounds available for this server",
      params: null
    },
    stats: {
      action: (user, server, top) => {
        return this.giveStats(server.id, top);
      },
      description:
        "View statistics about the soundbytes of this server, optionally of the [top] amount of most-played soundbytes",
      params: [["top", true]]
    }
  };
  protected _name = "sound";
  public info(): string {
    return "Add soundbytes from YouTube clips and play them";
  }
  public constructor(protected prefix: string, protected client: Client) {
    super();
    this.initializeHelpWidth();
  }
  private async addSound(
    serverID: string,
    userID: string,
    name: string,
    link: string,
    start: string,
    end: string,
    volume?: string
  ) {
    if (!ytdl.validateURL(link)) return `${link} is not a valid YouTube URL`;
    name = name.toLowerCase();
    let startNum = hmsToSeconds(start);
    let endNum = hmsToSeconds(end);
    let volumeNum: number;
    const wrongNum = Number.isNaN(startNum)
      ? start
      : Number.isNaN(endNum)
      ? end
      : null;
    if (wrongNum)
      return `${wrongNum} is not a valid timestamp. Use \`hh:mm:ss\` or \`mm:ss\` or \`ss\` format`;
    if (volume) volumeNum = parseInt(volume, 10);
    if (isNaN(volumeNum) || volumeNum < 1 || volumeNum > 100)
      return `${volumeNum} is not a valid number between 1 and 100`;
    const ss = await this.getSoundStore(serverID, true);
    if (ss.sounds.some(clip => clip.name === name))
      return `Sound with name ${name} already exists`;
    const ps: PlayableSoundProps = {
      __v: 0,
      name,
      link,
      addedBy: userID,
      createdAt: new Date(),
      start: startNum,
      end: endNum,
      volume: volumeNum
    };
    let totalSounds = ss.sounds.push(new PlayableSound(ps));
    await ss.save();
    return `Successfully added ${name}. This server now has ${totalSounds} sounds.`;
  }

  private async fetchSound(
    serverID: string,
    soundName: string
  ): Promise<PlayableSoundProps> {
    const ss = await this.getSoundStore(serverID);
    for (const sound of ss.sounds) {
      if (sound.name === soundName) return sound;
    }
    return null;
  }

  private async removeSound(serverID: string, soundName: string) {
    const ss = await this.getSoundStore(serverID);
    const removed = ss.sounds.splice(ss.sounds.indexOf(soundName), 1);
    if (removed === []) return `Sound with name ${soundName} does not exist`;
    await ss.save();
    return `Successfully removed ${soundName}`;
  }

  private async giveSoundList(serverID: string) {
    const ss = await this.getSoundStore(serverID);
    let msg = "```\n";
    let i = 0;
    ss.sounds.sort((a, b) => a.name.localeCompare(b.name));
    while (i < ss.sounds.length) {
      msg += ss.sounds[i].name;
      if (ss.sounds[i + 1]) {
        msg += " ".repeat(30) + ss.sounds[i + 1].name;
        i += 2;
      } else i++;
      msg += "\n";
    }
    msg += "```";
    return msg;
  }

  private async incrementPlayed(serverID: string, soundName: string) {
    const ss = await this.getSoundStore(serverID);

    let idx = -1;
    for (let i = 0; i < ss.sounds.length; i++) {
      console.log(ss.sounds[i].name, soundName);
      if (ss.sounds[i].name === soundName) idx = i;
    }
    if (idx === -1) {
      console.error("Index not found in incrementPlayed!");
      return;
    }
    ss.sounds[idx].played++;
    await ss.save();
  }

  private async giveStats(serverID: string, top?: string) {
    let topNum: number;

    if (top) topNum = parseInt(top);
    if (Number.isNaN(topNum)) return `${top} is not a valid number`;

    const soundsByPlayed: {
      _id: string;
      played: number;
      addedBy: string;
      createdAt: Date;
      addedAt: string;
    }[] = await SoundStore.aggregate([
      {
        $match: { serverID }
      },
      {
        $project: { sounds: 1 }
      },
      {
        $unwind: "$sounds"
      },
      {
        $group: {
          _id: "$sounds.name",
          played: { $sum: "$sounds.played" },
          addedBy: { $first: "$sounds.addedBy" },
          createdAt: { $first: "$sounds.createdAt" }
        }
      },
      {
        $sort: {
          played: -1
        }
      }
    ]).exec();
    let msg = "```";
    for (let s of soundsByPlayed) {
      s.addedBy = await this.userIDtoName(s.addedBy);
      s.addedAt = moment(s.createdAt).format(this._dateFormat);
      msg += `${s._id} - Played ${s.played} time`;
      msg += s.played === 1 ? ". " : "s. ";
      msg += `Added by ${s.addedBy} on ${s.addedAt}.\n`;
    }
    msg += "```";
    return msg;
  }

  private async getSoundStore(
    serverID: string,
    create = false
  ): Promise<SoundStoreDoc> {
    let ss = await SoundStore.findOne({ serverID });
    if (!ss && create) ss = await SoundStore.create({ serverID });
    else if (!ss)
      throw {
        messageToUser: "Error: This server does not have any sounds yet"
      };
    return ss;
  }
}
