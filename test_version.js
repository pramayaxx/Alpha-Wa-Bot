const { fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
async function test() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(version);
}
test();
