const Redis = require("ioredis");
const client = new Redis({
    password: "www.niewang.com"
});

const uuid = require("uuid");

module.exports = {
    client,
    uuid
};