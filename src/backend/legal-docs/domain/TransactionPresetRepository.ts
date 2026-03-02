import { TransactionPreset } from "./TransactionPreset";

export interface TransactionPresetRepository {
    save(preset: TransactionPreset): Promise<void>;
    findById(id: string): Promise<TransactionPreset | null>;
    findByUserId(userId: string): Promise<TransactionPreset[]>;
    findAll(): Promise<TransactionPreset[]>;
    delete(id: string): Promise<void>;
}
