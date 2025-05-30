import { makeWASocket, jidNormalizedUser, proto, WASocket, Contact } from "@nazi-team/baileys";

export function Socket(args: any, options: any = {}): WASocket {
    const sock = Object.defineProperties(makeWASocket(args), {})

    return sock
}

export async function Sms(sock: WASocket, m: any): Promise<any> {
    if (m.key?.remoteJid === "status@broadcast" || m.broadcast || !m.message) return;

    const message = m as proto.IWebMessageInfo & { id?: string; from?: string; body?: string };

    if (m.key) {
        message.id = m.key.id;
        message.from = m.key.remoteJid;
    }

    if (m.message) {
        message.body =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.templateButtonReplyMessage?.selectedDisplayText ||
            m.message.buttonsResponseMessage?.selectedButtonId ||
            m.message.listResponseMessage?.singleSelectReply?.selectedRowId
    }

    return message;
}
