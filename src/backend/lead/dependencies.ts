import { InMemoryLeadRepository } from "./infrastructure/InMemoryLeadRepository";

const leadRepository = new InMemoryLeadRepository();

export const leadDependencies = {
    leadRepository,
};
