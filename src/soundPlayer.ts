import { VoiceBroadcast } from "discord.js";
import { client } from "./bot";
import { VoiceChannel } from "discord.js";
import { YoutubeSoundProps as YoutubeSound } from "./database/schema";
import { asyncSleep } from "./utils";
import * as ytdl from "ytdl-core";
import { SoundFile as FileSound } from "./types";

// PlayerState
export enum PS {
  playing,
  stopped,
  shouldSkip,
  shouldStop
}

export class Sound {
  private _length: number;
  get length() {
    return this._length;
  }
  private _broadcast: VoiceBroadcast;
  private _name: string;
  get name() {
    return this._name;
  }
  public play: () => VoiceBroadcast;
  public toString() {
    return this._name;
  }
  constructor(soundStream: FileSound | YoutubeSound) {
    this._broadcast = client.createVoiceBroadcast();
    this._name = soundStream.name;
    // Play local sound
    if (soundStream instanceof FileSound) {
      if (soundStream.path.split(".").pop() !== "mp3")
        console.error("soundStream file should be .mp3");
      this.play = () => {
        this._broadcast.playFile(soundStream.path, {
          volume: soundStream.volume / 100
        });
        return this._broadcast;
      };
    }
    // Stream from YouTube
    else {
      const stream = ytdl(soundStream.link, { filter: "audioonly" });
      this._length = soundStream.end - soundStream.start;
      this.play = () => {
        this._broadcast.playStream(stream, {
          seek: soundStream.start,
          volume: soundStream.volume / 100
        });
        return this._broadcast;
      };
    }
  }
}

// Used by the base Bot to play any sounds that get passed as a string
export class SoundPlayer {
  private soundQueue: Sound[] = [];
  private _playState: PS = PS.stopped;
  public get playState() {
    return this._playState;
  }

  // Check state once every 1000ms
  private checkInterval = 1000;

  public constructor() {}

  public stop() {
    this._playState = PS.shouldStop;
  }

  public skip() {
    this._playState = PS.shouldSkip;
  }

  public async playSound(sound: Sound, channel: VoiceChannel) {
    if (channel === undefined) return;
    this.soundQueue.push(sound);
    // Sound has been enqueued, also start the player if it isn't playing already
    console.log("Queue: [");
    for (const i of this.soundQueue) {
      console.log(i.name + ",");
    }
    console.log("]");
    console.log("State:", this._playState);
    if (this._playState === PS.stopped) {
      this._playState = PS.playing;
      await channel
        .join()
        .then(async connection => {
          while (this.soundQueue.length > 0) {
            console.log("New sound");
            const currentSound = this.soundQueue.shift();
            const dispatcher = connection.playBroadcast(currentSound.play());
            let toWait = currentSound.length * 1000;
            while (toWait > 0) {
              if (this._playState !== PS.playing) {
                console.log("Should stop playing");
                dispatcher.end();
                toWait = 0;
              } else {
                await asyncSleep(this.checkInterval);
                toWait -= this.checkInterval;
              }
            }
            if (this._playState === PS.shouldStop) {
              this.soundQueue = [];
            } else {
              this._playState = PS.playing;
            }
          }
        })
        .catch(console.error);
      console.log("Done");
      channel.leave();
      this._playState = PS.stopped;
    }
  }
}
