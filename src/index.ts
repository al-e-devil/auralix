import {
    Browsers,
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    proto,
    WASocket
} from "@nazi-team/baileys";

import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import chalk from "chalk";
import figlet from "figlet";
import boxen from "boxen";
import gradient from "gradient-string";
import ora from "ora";

import config from "./config";
import { Sms, Socket } from "./lib/_whatsapp";

const start = async (): Promise<void> => {
    const { state, saveCreds } = await useMultiFileAuthState("./auth/session");
    const auralix: WASocket = Socket({
        logger: pino({ level: "silent" }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: Browsers.macOS("Chrome"),
        printQRInTerminal: false,
    });

    auralix.ev.on("creds.update", saveCreds);
    auralix.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            QRCode.toString(qr, {
                type: "terminal",
                errorCorrectionLevel: "L",
            }).then(console.log);
        }

        if (connection === "connecting") {
            const banner = gradient.instagram(figlet.textSync(config.bot.name, { font: "Standard" }));

            const info = boxen(
                `${chalk.cyan("Bot:")} ${chalk.bold(config.bot.name)}\n${chalk.magenta("Creado por:")} ${chalk.bold(config.bot.author)}`,
                { padding: 1, borderStyle: "round", borderColor: "cyan", margin: 1 }
            );
            console.clear();
            console.log(banner);
            console.log(info);

            const spinner = ora({
                text: chalk.cyan("Conectando al servidor..."),
                spinner: "dots",
            }).start();

            setTimeout(() => {
                spinner.succeed(chalk.green("¡Conexión exitosa!"));
            }, 2500);
        }
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.badSession) {
                console.log(`Sesión inválida. Revisa la configuración de tu sesión.`);
                process.exit();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(`Conexión cerrada inesperadamente. Verifica tu conexión a Internet.`);
                start();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(`Conexión perdida. Revisa tu red para reestablecer la conexión.`);
                start();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(`Conexión reemplazada. Otra instancia podría haber iniciado sesión.`);
                process.exit();
            } else if (reason === DisconnectReason.forbidden) {
                console.log(`Acceso prohibido. Verifica tus credenciales y permisos.`);
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Sesión cerrada. Es necesario iniciar sesión nuevamente.`);
                process.exit();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(`Es necesario reiniciar, se reiniciará automáticamente. Aguarde...`);
                start();
            } else if (reason === DisconnectReason.timedOut) {
                console.log(`Se agotó el tiempo de espera, reconectando...`);
                start();
            } else if (reason === DisconnectReason.unavailableService) {
                console.log(`Servicio no disponible, inténtalo nuevamente más tarde.`);
                start();
            } else {
                console.log(`Error de desconexión desconocido: ${reason} || ${connection}`);
            }
        }
    });

    auralix.ev.on("messages.upsert", async ({ messages, type }) => {
        for (const message of messages) {
            if (type === "notify" && message.message) {
                const m = await Sms(auralix, message);

                if (m.body === "word") {
                    auralix.sendMessage(m.from, { text: "haai papi word" });
                }
            }
        }
    });
};
start().then().catch(console.error)
