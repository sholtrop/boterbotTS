import { Attachment, Client } from "discord.js";
import { BotModule, ModuleHandler } from "../../command";
import * as Jimp from "jimp";
import { AnyTextChannel } from "../../types";
import * as fs from "fs";
import { templateData } from "./templateData";

export class MemeCreator extends BotModule {
  protected handlers: { [index: string]: ModuleHandler } = {
    "": {
      action: ({ messageChannel, args }) => {
        const [template, first, second] = args;
        return this.createMeme(messageChannel, template, first, second);
      },
      description: "Create a meme",
      params: [
        { name: "template", optional: false },
        { name: "first text", optional: false },
        { name: "second text", optional: false }
      ]
    },
    list: {
      action: () => {
        return this.showTemplates();
      },
      description: "View available meme templates",
      params: null
    }
  };

  protected _name = "meme";
  public info() {
    return "Make epic custom memes using templates";
  }
  constructor(protected prefix: string, protected client: Client) {
    super();
  }
  private async createMeme(
    channel: AnyTextChannel,
    templateName: string,
    firstText: string,
    secondText: string
  ): Promise<string> {
    try {
      const template = templateData[templateName];
      if (!template)
        return `Error: No meme template named ${templateName}. Try \`!meme list\``;
      const font = await Jimp.loadFont(template.font);
      const img = await Jimp.read(
        process.cwd() + "/src/modules/meme/templates/" + templateName + ".png"
      );
      const finalimg = await img
        .print(
          font,
          template.startFirstX,
          template.startFirstY,
          firstText,
          template.endX,
          template.endY
        )
        .print(
          font,
          template.startSecondX,
          template.startSecondY,
          secondText,
          template.endX,
          template.endY
        )
        .getBufferAsync(Jimp.MIME_JPEG);
      const attachment = new Attachment(finalimg);
      channel.send("", attachment);
    } catch (e) {
      console.error(e);
      throw { messageToUser: "Something went wrong... :(" };
    }
    return null;
  }
  private async showTemplates(): Promise<string> {
    let msg = "Available meme templates:\n```";
    const names = this.getNames();
    for (const name of names) {
      msg += name.split(".")[0] + "\n";
    }
    return msg + "```";
  }
  private getNames(): string[] {
    return fs.readdirSync(process.cwd() + "/src/modules/meme/templates");
  }
}
