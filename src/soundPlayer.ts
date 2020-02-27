import { VoiceBroadcast, Channel, VoiceConnection } from "discord.js";
import { client } from "./bot";
import { VoiceChannel } from "discord.js";
import { YoutubeSoundProps as YoutubeSound } from "./database/schema";
import { asyncSleep } from "./utils";
import * as ytdl from "ytdl-core";

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
  constructor(soundStream: string | YoutubeSound, volume?: number) {
    this._broadcast = client.createVoiceBroadcast();

    // Play local sound
    if (typeof soundStream === "string") {
      this._name = soundStream;
      this._length = 0;
      this.play = () => {
        this._broadcast.playFile(`./assets/${soundStream}.mp3`, {
          volume: (volume || 10) / 100
        });
        return this._broadcast;
      };
    }
    // Stream from YouTube
    else {
      this._name = soundStream.name;
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
    if (this._playState === PS.stopped) {
      this._playState = PS.playing;
      await channel.join().then(async connection => {
        while (this.soundQueue.length > 0) {
          const currentSound = this.soundQueue.shift();
          console.log(currentSound.name);
          const dispatcher = connection.playBroadcast(currentSound.play());
          let toWait = currentSound.length * 1000;
          while (toWait > 0) {
            if (this._playState !== PS.playing) {
              console.log("Stop");
              dispatcher.end();
              toWait = 0;
            } else {
              await asyncSleep(this.checkInterval);
              console.log("playing...");
              toWait -= this.checkInterval;
            }
          }
          if (this._playState === PS.shouldStop) {
            this.soundQueue = [];
          } else {
            this._playState = PS.playing;
          }
        }
        channel.leave();
        this._playState = PS.stopped;
      });
    }
  }
}
