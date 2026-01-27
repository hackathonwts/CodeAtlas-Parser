export type OwnershipCondition = 'own' | 'any';

export interface IPolicy {
    resource: string;
    action: string;
    conditions?: IPolicyConditions;
}

export interface IPolicyConditions {
    ownership?: OwnershipCondition;
    [resourceField: string]: 'own' | string | number | boolean | Array<string | number | boolean> | undefined;
}
