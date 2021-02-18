/*
    Ascii art
        and CLI view generation
            -Highlander
 */
const TAG = " | App | ";
const chalk = require("chalk");
const figlet = require("figlet");
const log = require("loggerdog-client")();


export function showWelcome() {
    let tag = TAG + " | importConfig | ";
    try {
        log.info(
            "\n",
            chalk.blue(figlet.textSync("Thorchain-cli", {horizontalLayout: "full"}))
        );
        log.info("\n     _.-._\n" +
            "   .' | | `.          Thorchain Protocal CLI\n" +
            "  /   | |   \\                 \n" +
            " |    | |    |\n" +
            " |____|_|____|\n" +
            " |____"+chalk.yellowBright("(₿)")+"____|\n" +
            " /|(o)| |(o)|\\   \"It gladdens me to know that Odin prepares for a feast... \n" +
            "/ |   | |   | \\       This hero that comes into Valhalla does not lament his death!\n" +
            "\\ |  (|_|)  | /         I shall not enter Odin's hall with fear.\"\n" +
            " | \\/     \\/ |\n" +
            " / /  ___  \\ \\  \n" +
            "(             )\n" +
            " \\           /\n" +
            " `._______.'");
        log.info(
            " \n A simple Multi-Coin Wallet and Swapping CLI      \n \n                        ---Highlander \n "
        );
    } catch (e) {
        console.error(tag, "e: ", e);
        return {};
    }
}
