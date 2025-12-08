export type RoomData = {
    id: string;
    name: string;
    creator: string;
    creatorId?: string;
    player1?: string | null;
    player2?: string | null;
};