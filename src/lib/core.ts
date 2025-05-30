import makeWASocket, { GroupMetadata, UserFacingSocketConfig, WASocket as BaileysSocket } from "@nazi-team/baileys"

export const groupMetadata = new Map<string, GroupMetadata>();

export class WASocket {
    private socket: BaileysSocket;

    constructor(config: UserFacingSocketConfig) {
        this.socket = makeWASocket(config);
    }

    public async fetchGroup(jid: string) {
        const cached = groupMetadata.get(jid);
        if (cached) {
            const meta = await this.socket.groupMetadata(jid).catch(() => null);
            if (!meta) return;
            groupMetadata.set(jid, meta);
            return cached;
        }
        return cached;
    }

    get user() { return this.socket.user; }
    get ev() { return this.socket.ev; }
    get ws() { return this.socket.ws; }
}