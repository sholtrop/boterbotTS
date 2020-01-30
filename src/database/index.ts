import * as mongoose from "mongoose";

export function setupDatabase() {
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  mongoose.set("useUnifiedTopology", true);
  const connectionString =
    process.env.DATABASE_URL || "mongodb://localhost/boterbot";
  mongoose.connect(connectionString, { useNewUrlParser: true });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "Mongoose - connection error"));
  db.once("open", () => {
    console.log("Mongoose - Connected to database");
  });
}
