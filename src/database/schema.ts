import { createSchema, Type, typedModel, ExtractDoc } from "ts-mongoose";

const UserQuoteSchema = createSchema(
  {
    quote: Type.string({ required: true }),
    quotedPerson: Type.string({ required: true }),
    addedByID: Type.string({ required: true })
  },
  { timestamps: { createdAt: true }, _id: false }
);

const QuoteStoreSchema = createSchema({
  serverID: Type.string({ required: true, unique: true }),
  quoteHavers: Type.array({ default: [] }).of(Type.string({ unique: true })),
  quotes: Type.array({ default: [] }).of(UserQuoteSchema)
});

export const UserQuote = typedModel("UserQuote", UserQuoteSchema);
export const QuoteStore = typedModel("QuoteStore", QuoteStoreSchema);
export type UserQuoteDoc = ExtractDoc<typeof UserQuoteSchema>;