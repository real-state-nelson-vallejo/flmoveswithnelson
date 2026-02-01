// import { InMemoryLeadRepository } from "./infrastructure/InMemoryLeadRepository";
import { FirestoreLeadRepository } from "./infrastructure/FirestoreLeadRepository";

const leadRepository = new FirestoreLeadRepository();

export const leadDependencies = {
    leadRepository,
};
