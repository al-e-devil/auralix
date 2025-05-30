import {
    AuthenticationCreds,
    BaileysEventMap,
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@nazi-team/baileys";

import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino, { Logger } from "pino";
import chalk from "chalk";

import config from "./config";
import { Sms, Socket } from "./lib/normalize"
import { groupMetadata, WASocket } from "./lib/core"
import SQLite from "./lib/sqlite";

const start = async (): Promise<void> => {
    const DEFAULT_CACHE_NAME = "open"
    let retries = 0
    const session = new Map<string, WASocket>()
    const logger: Logger = pino({ level: "silent" })
    let { state, saveCreds } = await SQLite.AuthState('socket', 'auth.db', logger)

    let { version } = await fetchLatestBaileysVersion()
    let auralix: WASocket | null = new WASocket({
        auth: { creds: state.creds as AuthenticationCreds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        cachedGroupMetadata: async (jid: string) => groupMetadata.get(jid),
        logger: logger,
        version: version
    })

    auralix?.ev.process(async (ev: Partial<BaileysEventMap>) => {
        if (!ev) return
        if (ev['creds.update']) await saveCreds()
        if (ev["connection.update"]) {
            const up = ev["connection.update"];
            const { qr, connection, lastDisconnect } = up

            if (qr) {
                console.log(chalk.greenBright('[ ! ]') + "scan this qr")
                QRCode.toString(qr, {
                    type: "terminal",
                    errorCorrectionLevel: "L",
                }).then(console.log)
            }
            switch (connection) {
                case 'open':
                    return
                case 'close':
                    const reason = new Boom(lastDisconnect?.error).output.statusCode
                    let text: string
                    switch (reason) {
                        case DisconnectReason.connectionLost:
                        case DisconnectReason.forbidden:
                        case DisconnectReason.badSession:
                        case DisconnectReason.timedOut:
                        case DisconnectReason.unavailableService:
                            if (retries <= 3) {
                                retries++
                                await start()
                            } else {
                                text = `[ ! ] connection closed: ${reason in DisconnectReason ? DisconnectReason[reason] : reason}`
                                console.log(chalk.redBright(text))
                                session.delete(DEFAULT_CACHE_NAME)
                                process.exit(1)
                            }
                            break
                        case DisconnectReason.connectionClosed:
                        case DisconnectReason.connectionReplaced:
                            text = `[ ! ] connection closed: ${reason in DisconnectReason ? DisconnectReason[reason] : reason}`
                            console.log(chalk.redBright(text))
                            session.delete(DEFAULT_CACHE_NAME)
                            break
                        case DisconnectReason.restartRequired:
                            await start()
                            break

                    }
                    break
            }
        }
        if (ev["messages.upsert"]) {
            for (const m of ev["messages.upsert"].messages) {
                console.log(JSON.stringify(m, null, 2))
            }
        }
    })
}
start().then().catch(console.error)