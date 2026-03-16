import express from "express";
import { db } from "./db.js";
import { checkSession } from "./auth.js";
export const setupRouter = express.Router();

const checkSetupMode = async (req, res, next) => {
    if (process.env.TOKEN) {
        return res.status(404).send('Not found');
    }
    try {
        const result = await db.query("SELECT COUNT(*) FROM users WHERE perm >= 3 AND banned = false;");
        if (parseInt(result.rows[0].count) > 0) {
            return res.status(404).send('Not found');
        }
        next();
    } catch (err) {
        res.status(500).send(err.message);
    }
};

setupRouter.get('/status', checkSetupMode, (req, res) => {
    res.json({ setup: true });
});

setupRouter.post('/oidc', checkSetupMode, async (req, res) => {
    try {
        const reqs = ['id', 'secret', 'redirect_uri', 'apipoint', 'auth_url', 'name'];
        if (reqs.filter(i => !req.body[i]).length > 0) {
            return res.status(400).send('Missing required fields');
        }
        await db.query(
            `INSERT INTO oidc (id,secret,perm,frontend,redirect_uri,apipoint,auth_url,name)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (id) DO UPDATE SET
               secret=$2, perm=$3, frontend=$4, redirect_uri=$5, apipoint=$6, auth_url=$7, name=$8;`,
            [req.body.id, req.body.secret, req.body.perm || null, req.body.frontend || null,
             req.body.redirect_uri, req.body.apipoint, req.body.auth_url, req.body.name]
        );
        res.send('Success.');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

setupRouter.post('/promote', checkSetupMode, checkSession(0), async (req, res) => {
    try {
        await db.query("UPDATE users SET perm=3, banned=false WHERE id=$1;", [req.sessionUserId]);
        await db.query("UPDATE session SET perm=3 WHERE uuid=$1;", [req.cookies.session_id]);
        res.send('Success.');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

setupRouter.post('/promote-by-id', checkSetupMode, async (req, res) => {
    try {
        const { userid } = req.body;
        if (!userid) return res.status(400).send('Missing userid');
        const result = await db.query(
            "UPDATE users SET perm=3, banned=false WHERE id=$1;",
            [userid]
        );
        if (result.rowCount === 0) return res.status(404).send('User not found');
        res.send('Success.');
    } catch (err) {
        res.status(500).send(err.message);
    }
});
