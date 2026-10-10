const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { app, pool } = require("../src/server");

let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test("GET /health returns healthy when the database responds", async () => {
    const originalQuery = pool.query;
    pool.query = async () => ({ rows: [{ result: 1 }] });

    try {
        const response = await fetch(`${baseUrl}/health`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            status: "ok",
            database: "connected"
        });
    } finally {
        pool.query = originalQuery;
    }
});

test("GET /health returns an error when the database query fails", async () => {
    const originalQuery = pool.query;
    pool.query = async () => {
        throw new Error("database unavailable");
    };

    try {
        const response = await fetch(`${baseUrl}/health`);
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), {
            status: "error",
            database: "disconnected"
        });
    } finally {
        pool.query = originalQuery;
    }
});