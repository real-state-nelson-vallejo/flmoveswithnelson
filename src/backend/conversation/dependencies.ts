import { FirestoreConversationRepository } from "./infrastructure/FirestoreConversationRepository";
import { GetConversationService } from "./application/GetConversationService";
import { SendMessageService } from "./application/SendMessageService";
import { StartConversationService } from "./application/StartConversationService";

const conversationRepository = new FirestoreConversationRepository();

export const conversationDependencies = {
    conversationRepository,
    getConversation: new GetConversationService(conversationRepository),
    sendMessage: new SendMessageService(conversationRepository),
    startConversation: new StartConversationService(conversationRepository)
};
