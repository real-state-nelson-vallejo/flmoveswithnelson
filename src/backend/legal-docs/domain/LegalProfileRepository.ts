import { LegalProfile } from "./LegalProfile";

export interface LegalProfileRepository {
    save(profile: LegalProfile): Promise<void>;
    findByUserId(userId: string): Promise<LegalProfile | null>;
}
