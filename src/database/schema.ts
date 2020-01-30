import { Schema, model, Document } from "mongoose";
import { createSchema, typedModel, ExtractDoc, Type } from "ts-mongoose";

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
// Must be created manually (not through ts-mongoose) because it doesn't support Maps
export interface QuoteStoreDoc extends Document {
  serverID: string;
  quotes: Map<string, Array<UserQuoteDoc>>;
}
