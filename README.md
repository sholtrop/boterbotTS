# BoterbotTS

Discord bot written in TypeScript.

## Install

1. Clone the repo:

```bash
git clone https://github.com/sholtrop/boterbotTS
```

2. Then install the dependencies:

```bash
cd boterbotTS && npm install
```
3. Add a `dev.env` file with:

```
BOT_TOKEN=<your token here>
```
Never commit this file, as you would expose your bot's secret token!

4. Run the dev setup with:

```bash
npm run dev
```

## Deploying

# Heroku
I personally use a Docker image in combination wit heroku. A `heroku.yml` file is included for this purpose. Set up a Heroku account, and follow the instructions [here](https://devcenter.heroku.com/articles/build-docker-images-heroku-yml).

# Docker-compose
You will need to add two files:
- db.env with

```
MONGO_INITDB_ROOT_USERNAME=<any username you want>
MONGO_INITDB_ROOT_PASSWORD=<any password you want>
```

- bot.env with
```
MONGODB_URI=<mongodb://<username from db.env>:<password from db.env>@database:27017
BOT_TOKEN=<your token here>
```
Then you can launch the bot with `docker-compose up --build`.
