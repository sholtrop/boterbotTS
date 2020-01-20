import * as mongoose from "mongoose";

export function setupDatabase() {
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  mongoose.set("useUnifiedTopology", true);
  mongoose.connect("mongodb://localhost/boterbot", { useNewUrlParser: true });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "Mongoose - connection error"));
  db.once("open", () => {
    console.log("Mongoose - Connected to database");
  });
}
