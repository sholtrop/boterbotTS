import { BotModule } from "../command";
import { VoiceChannel } from "discord.js";
import { PlayableSoundProps } from "../database/schema";
import { asyncSleep } from "../utils";
import * as ytdl from "ytdl-core";

// Base class for a BotModule that needs to interact with PlayableSounds
export abstract class SoundModule extends BotModule {
  protected async playSound(channel: VoiceChannel, sound: PlayableSoundProps) {
    const broadcast = this.client.createVoiceBroadcast();
    const options = { seek: sound.start, volume: sound.volume / 100 };
    if (channel === undefined) return;
    await channel
      .join()
      .then(async connection => {
        const stream = ytdl(sound.link, { filter: "audioonly" });
        broadcast.playStream(stream, options);
        const dispatcher = connection.playBroadcast(broadcast);
        await asyncSleep((sound.end - sound.start) * 1000);
        dispatcher.end();
      })
      .catch(console.error);
    channel.leave();
  }
}
