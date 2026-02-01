import { FirestoreEmailRepository } from "./infrastructure/FirestoreEmailRepository";
import { SendEmailService } from "./application/SendEmailService";

const emailRepository = new FirestoreEmailRepository();

export const emailDependencies = {
    emailRepository,
    sendEmail: new SendEmailService(emailRepository)
};
