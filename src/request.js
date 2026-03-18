import express from "express";
import {db} from "./db.js";
export const userRequestRouter = express.Router();

const MAX_PENDING_PER_USER = parseInt(process.env.MAX_PENDING_PER_USER) || 3;

userRequestRouter.get("/list", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM server_requests WHERE userid=$1 ORDER BY created_at DESC;",
            [req.sessionUserId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

userRequestRouter.post("/create", async (req, res) => {
    try {
        const { req_type, target_uuid, data } = req.body;
        if (!req_type || !data) {
            return res.status(400).send('Missing required fields');
        }
        if (!['create', 'edit', 'delete'].includes(req_type)) {
            return res.status(400).send('Invalid req_type');
        }
        if (req_type === 'delete' && !target_uuid) {
            return res.status(400).send('target_uuid required for delete requests');
        }
        const result = await db.query(
            `INSERT INTO server_requests (userid, req_type, target_uuid, data)
             VALUES ($1, $2, $3, $4) RETURNING *;`,
            [req.sessionUserId, req_type, target_uuid || null, JSON.stringify(data || {})]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

userRequestRouter.post("/edit", async (req, res) => {
    try {
        const { id, data, req_type, target_uuid } = req.body;
        if (!id || !data) {
            return res.status(400).send('Missing required fields');
        }
        const existing = (await db.query(
            "SELECT * FROM server_requests WHERE id=$1;", [id]
        )).rows;
        if (existing.length === 0) {
            return res.status(404).send('Request not found');
        }
        if (existing[0].userid !== req.sessionUserId) {
            return res.status(403).send('Permission denied');
        }
        if (existing[0].status !== 'draft' && existing[0].status !== 'rejected') {
            return res.status(400).send('Can only edit draft or rejected requests');
        }
        const newReqType = req_type || existing[0].req_type;
        const newTargetUuid = target_uuid !== undefined ? (target_uuid || null) : existing[0].target_uuid;
        const result = await db.query(
            `UPDATE server_requests SET data=$1, req_type=$2, target_uuid=$3, status='draft', updated_at=now()
             WHERE id=$4 RETURNING *;`,
            [JSON.stringify(data), newReqType, newTargetUuid, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

userRequestRouter.post("/submit", async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.body;
        if (!id) return res.status(400).send('Missing id');

        await client.query('BEGIN');

        // 锁定当前请求
        const existingRes = await client.query(
            "SELECT * FROM server_requests WHERE id=$1 FOR UPDATE;",
            [id]
        );
        if (existingRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Request not found');
        }
        const existing = existingRes.rows[0];
        if (existing.userid !== req.sessionUserId) {
            await client.query('ROLLBACK');
            return res.status(403).send('Permission denied');
        }
        if (existing.status !== 'draft') {
            await client.query('ROLLBACK');
            return res.status(400).send('Can only submit draft requests');
        }

        // 锁定该用户所有pending请求，防止并发增多
        const pendingRowsRes = await client.query(
            "SELECT id FROM server_requests WHERE userid=$1 AND status='pending' FOR UPDATE;",
            [req.sessionUserId]
        );
        const pendingCount = pendingRowsRes.rows.length;

        if (pendingCount >= MAX_PENDING_PER_USER) {
            await client.query('ROLLBACK');
            return res.status(429).send(`Too many pending requests (max ${MAX_PENDING_PER_USER})`);
        }

        // 更新当前请求状态为pending
        await client.query(
            "UPDATE server_requests SET status='pending', updated_at=now() WHERE id=$1;",
            [id]
        );

        await client.query('COMMIT');
        res.send("Success");
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
});

userRequestRouter.post("/cancel", async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).send('Missing id');
        const existing = (await db.query(
            "SELECT * FROM server_requests WHERE id=$1;", [id]
        )).rows;
        if (existing.length === 0) return res.status(404).send('Request not found');
        if (existing[0].userid !== req.sessionUserId) return res.status(403).send('Permission denied');
        if (existing[0].status !== 'pending') return res.status(400).send('Can only cancel pending requests');

        await db.query(
            "UPDATE server_requests SET status='draft', updated_at=now() WHERE id=$1;", [id]
        );
        res.send("Success");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

userRequestRouter.post("/delete", async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).send('Missing id');
        const existing = (await db.query(
            "SELECT * FROM server_requests WHERE id=$1;", [id]
        )).rows;
        if (existing.length === 0) return res.status(404).send('Request not found');
        if (existing[0].userid !== req.sessionUserId) return res.status(403).send('Permission denied');
        if (existing[0].status !== 'draft') return res.status(400).send('Can only delete draft requests');

        await db.query("DELETE FROM server_requests WHERE id=$1;", [id]);
        res.send("Success");
    } catch (err) {
        res.status(500).send(err.message);
    }
});
