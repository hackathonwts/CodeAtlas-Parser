export enum ParserEventType {
    CREATED = 'user.created',
    UPDATED = 'user.updated',
    DELETED = 'user.deleted',
}

export interface ParserEvent {
    type: ParserEventType;
    payload: {
        id: string;
        name?: string;
        email?: string;
    };
}
