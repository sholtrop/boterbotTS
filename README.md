# BoterbotTS

Discord bot written in TypeScript, using MongoDB as a database.

To use it as a template:

1. ```git clone https://github.com/sholtrop/boterbotTS```

2. Add a `src/config.ts` file that exports a config. For example:

    ```typescript
    import { BotConfig } from "./bot";
    import { allModules } from "./modules";
    const PREFIX = "!";

    export const config: BotConfig = {
      token:
        process.env.BOT_TOKEN ||
        "YOUR_TOKEN_HERE_OR_IN_ENVIRONMENT",
      prefix: PREFIX,
      modules: allModules(PREFIX)
    };
    ```

3. ```npm install```
4. ```npm run dev```

You can develop your own modules and put them in `src/modules`. It should be a class that extends `BotModule`. Instantiate it in `src/modules/index.ts` and export it by putting it in the `allModules` array. The module has now been added to the bot.
