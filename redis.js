const client = require("redis").createClient({
    password: "www.niewang.com"
});
const batch = client.batch();

const uuid = require("uuid");

module.exports = {
    client,
    uuid,
    batch
};