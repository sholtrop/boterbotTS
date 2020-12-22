import { BotModule, ModuleHandler } from "../command";
import { Client, Guild, VoiceChannel, VoiceConnection, User } from "discord.js";
import { validateNumber, asyncSleep } from "../utils";
import { HandlerResponse, AnyTextChannel } from "../types";
import { WritableStream } from "memory-streams";
import * as wav from "wav";
import * as fs from "fs";

export class SpeechToText extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    join: {
      action: async ({ server, user }) => {
        const member = await server.fetchMember(user);
        const channel = member.voiceChannel;
        if (!channel)
          return { message: "Error: You need to be in a voice channel" };
        this.joinChannel(channel, user);
        return {
          message:
            `To start recording, type \`!stt start\`. To stop recording, type \`!stt stop\`.\n` +
            `I can only record one person, and that person will be the one who summoned me (${member.displayName}) for now.\n` +
            `To change the target, type \`!stt target <mention-target>\`. They need to be in this voice channel.`
        };
      },
      params: null,
      description: "Have BoterBotTS join the channel so it can start recording"
    },
    start: {
      action: async ({ args, messageChannel }) => {
        return await this.startRecording(args[0], messageChannel);
      },
      params: [{ name: "seconds", optional: true }],
      description: "Start recording, after having joined the channel"
    },
    stop: {
      action: async () => {
        this.shouldStop = true;
        return null;
      },
      params: null,
      description: "Stop recording and transcribe the recorded audio"
    },
    leave: {
      action: async ({ server }) => {
        await this.leaveChannel(server);
        return null;
      },
      params: null,
      description: "Have BoterBotTS leave the voice channel"
    }
  };
  protected _name = "stt";
  public info() {
    return "Have BoterBotTS record your voice and turn it into text (English only)";
  }
  constructor(protected prefix: string, protected client: Client) {
    super();
  }
  private currentVoice: VoiceConnection = null;
  private currentChannel: VoiceChannel = null;
  private currentTarget: User = null;
  private audioBuffer: Buffer = null;
  private audioMetadata: wav.WriterOptions = {
    sampleRate: 48000,
    channels: 2
  };
  private shouldStop = false;
  private async joinChannel(channel: VoiceChannel, summoner: User) {
    if (this.currentChannel)
      throw { messageToUser: "Error: I'm already in a voice channel" };
    this.currentChannel = channel;
    this.currentVoice = await channel.join();
    this.currentTarget = summoner;
  }
  private async startRecording(
    seconds: string,
    messageChannel: AnyTextChannel
  ): Promise<HandlerResponse> {
    if (!this.currentChannel)
      throw { messageToUser: "Error: I'm not in a voice channel" };
    if (!this.currentTarget) throw { messageToUser: "Error" };
    if (!this.currentVoice) this.currentVoice = this.currentChannel.connection;
    let sec = validateNumber(seconds, [5, 30], "seconds");
    if (sec === undefined) sec = 10;
    const receiver = this.currentVoice.createReceiver();
    console.log(this.currentVoice.channel.name);
    const wavWrite = new wav.Writer(this.audioMetadata);
    const wstream = new WritableStream();
    this.currentVoice.on("speaking", (user, speaking) => {
      console.log("Speaking");
      if (user === this.currentTarget && speaking) {
        messageChannel.send(`Recording ${this.currentTarget.username}...`);
        const audioStream = receiver.createPCMStream(user);
        audioStream.pipe(wavWrite).pipe(wstream);
      }
    });
    await asyncSleep(sec * 1000);
    this.currentVoice.removeAllListeners();
    this.audioBuffer = wstream.toBuffer();
    fs.writeFileSync("test.wav", this.audioBuffer);
    console.log("Recorded " + this.audioBuffer.byteLength + " bytes");
    return { message: `Done. Recorded ${this.audioBuffer.length} bytes.` };
  }

  private async leaveChannel(server: Guild) {
    if (!this.currentChannel)
      (await server.fetchMember(this.client.user)).setVoiceChannel(null);
    else this.currentChannel.leave();
    this.currentChannel = null;
    this.currentVoice = null;
    this.audioBuffer = null;
  }
}
