const client = require("redis").createClient({
    password: "foobared"
});
const batch = client.batch();

const uuid = require("uuid");

module.exports = {
    client,
    uuid,
    batch
};