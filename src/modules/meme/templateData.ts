import * as fs from "fs";
import * as Jimp from "jimp";
import { MemeTemplateData } from "../../types";
const templates: MemeTemplateData = {
  winnie: {
    font: Jimp.FONT_SANS_32_BLACK,
    startFirstX: 355,
    startFirstY: 30,
    startSecondX: 355,
    startSecondY: 330,
    endX: 440,
    endY: 800
  },
  behindyou: {
    font: Jimp.FONT_SANS_32_BLACK,
    startFirstX: 490,
    startFirstY: 130,
    startSecondX: 10,
    startSecondY: 740,
    endX: 240,
    endY: 800
  }
};
const templateList = Object.keys(templates);
const fileList = fs.readdirSync(process.cwd() + "/src/modules/meme/templates");
for (let i = 0; i < templateList.length; i++) {
  const toCheck = templateList.pop() + ".png";
  if (!fileList.includes(toCheck))
    throw { error: `Missing file ${toCheck} for meme templates` };
}
console.log("Meme - Using these templates:", Object.keys(templates));

export const templateData = templates;
