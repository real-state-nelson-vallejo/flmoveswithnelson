import { Email } from "./Email";

export interface EmailRepository {
    sendEmail(email: Email): Promise<void>;
}
