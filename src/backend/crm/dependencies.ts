import { FirestoreConversationRepository } from "./infrastructure/FirestoreConversationRepository";
// import { FirestoreLeadRepository } from "./infrastructure/FirestoreLeadRepository";
import { FirestoreEmailRepository } from "./infrastructure/FirestoreEmailRepository";

export const conversationRepository = new FirestoreConversationRepository();
export const emailRepository = new FirestoreEmailRepository();
// export const leadRepository = new FirestoreLeadRepository();
