import { config } from "./config";
import { BoterBot } from "./bot";
import { setupDatabase } from "./database";

setupDatabase();
const bot = new BoterBot(config);
bot.run();
