import {GoogleGenerativeAI} from "@google/generative-ai";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import {PropertyPersistenceModel} from "./types.js";

export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const VECTOR_COLLECTION = "properties_vectors";
const MODEL_NAME = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

function toEmbeddingText(p: PropertyPersistenceModel): string {
  const locationStr = `${p.City}, ${p.StateOrProvince || ""} ${p.PostalCode || ""}`.trim();
  const features = [
    p.WaterfrontYN ? "Waterfront" : "",
    p.PoolPrivateYN ? "Private Pool" : "",
    p.GarageSpaces ? `${p.GarageSpaces} Car Garage` : "",
    ...(p.ArchitecturalStyle || []),
  ].filter(Boolean).join(", ");

  return `
    Title: ${p.UnparsedAddress}, ${p.City}
    Type: ${p.PropertySubType || p.PropertyType}
    Status: ${p.StandardStatus}
    Location: ${locationStr}
    Details: ${p.BedroomsTotal} Beds, ${p.BathroomsTotalInteger} Baths. ${p.YearBuilt ? `Built in ${p.YearBuilt}.` : ""}
    Features: ${features}
    Description: ${p.PublicRemarks}
  `.replace(/\s+/g, " ").trim();
}

export async function embedAndStore(
  db: admin.firestore.Firestore,
  property: PropertyPersistenceModel,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({model: MODEL_NAME});

  const text = toEmbeddingText(property);
  const result = await model.embedContent(text);
  const raw = result.embedding?.values || [];
  const vector = raw.slice(0, EMBEDDING_DIMS);
  while (vector.length < EMBEDDING_DIMS) vector.push(0);

  await db.collection(VECTOR_COLLECTION).doc(property.ListingKey).set({
    propertyId: property.ListingKey,
    input_text: text,
    price: property.ListPrice ?? 0,
    beds: property.BedroomsTotal ?? 0,
    baths: property.BathroomsTotalInteger ?? 0,
    city: property.City ?? "",
    type: property.PropertyType ?? "",
    status: property.StandardStatus ?? "",
    embedding: admin.firestore.FieldValue.vector(vector),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}
