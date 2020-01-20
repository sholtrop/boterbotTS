import * as mongoose from "mongoose";

mongoose.connect("mongodb://localhost/boterbot", { useNewUrlParser: true });
export const db = mongoose.connection;
db.on("error", console.error.bind(console, "Mongoose - connection error"));
db.once("open", () => {
  console.log("Mongoose - Connected to database");
});
