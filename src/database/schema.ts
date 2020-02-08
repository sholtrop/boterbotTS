import { Schema, model, Document } from "mongoose";
import {
  createSchema,
  typedModel,
  ExtractDoc,
  Type,
  ExtractProps
} from "ts-mongoose";

// USER QUOTES
const UserQuoteSchema = createSchema(
  {
    quote: Type.string({ required: true }),
    addedBy: Type.string({ required: true })
  },
  {
    timestamps: { createdAt: true },
    id: false,
    _id: false
  }
);

const QuoteStoreSchema = new Schema({
  serverID: { type: String, required: true },
  quotes: {
    type: Map,
    of: Array,
    default: {}
  }
});

export const UserQuote = typedModel("UserQuote", UserQuoteSchema);

export const QuoteStore = model("QuoteStore", QuoteStoreSchema);

export type UserQuoteDoc = ExtractDoc<typeof UserQuoteSchema>;
export type UserQuoteProps = ExtractProps<typeof UserQuoteSchema>;
// Must be created manually (not through ts-mongoose) because it doesn't support Maps
export interface QuoteStoreDoc extends Document {
  serverID: string;
  quotes: Map<string, Array<UserQuoteDoc>>;
}

// PLAYABLE SOUNDS
const YoutubeSoundSchema = createSchema(
  {
    name: Type.string({ required: true, unique: true }),
    link: Type.string({ required: true }),
    volume: Type.number({ default: 30, min: 1, max: 100 }),
    start: Type.number({ required: true }),
    end: Type.number({ required: true }),
    addedBy: Type.string({ required: true }),
    played: Type.number({ default: 0, validate: Number.isInteger })
  },
  { timestamps: { createdAt: true }, _id: false }
);
export const PlayableSound = typedModel("PlayableSound", YoutubeSoundSchema);
export type YoutubeSoundDoc = ExtractDoc<typeof YoutubeSoundSchema>;
const SoundStoreSchema = createSchema({
  serverID: Type.string({ required: true }),
  sounds: Type.array({ default: [] }).of(YoutubeSoundSchema)
});
export const SoundStore = typedModel("SoundStore", SoundStoreSchema);
export type SoundStoreDoc = ExtractDoc<typeof SoundStoreSchema>;
export type YoutubeSoundProps = ExtractProps<typeof YoutubeSoundSchema>;
