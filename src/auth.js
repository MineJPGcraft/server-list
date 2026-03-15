import express from "express";
import axios from "axios";
import {db} from "./db.js"
import jwt from "jsonwebtoken";
export const authRouter = express.Router();
authRouter.get("/callback", async (req, res) => {
    if(!req.query.code||!req.query.state)
    {
        return res.status(400).send('Missing required fields');
    }
    const client=await db.connect();
    try
    {
        await client.query("BEGIN;");
        const oidc_client=(await client.query("SELECT * FROM oidc WHERE id=$1;",[req.query.state])).rows;
        if(oidc_client.length<=0)
        {
            client.query("COMMIT;")
            return res.status(400).send('Missing required fields');
        }
        const oidc_info=await axios({
            method: 'POST',
            url: oidc_client[0].apipoint,
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            data: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: oidc_client[0].id,
                client_secret: oidc_client[0].secret,
                code: req.query.code,
                redirect_uri: oidc_client[0].redirect_uri
            })
        });
        const json_info=jwt.decode(oidc_info.data.id_token);
        const user_info=(await client.query("SELECT * FROM users WHERE id=$1;",[json_info.sub])).rows;
        if(user_info.length<=0)
        {
            await client.query(`INSERT INTO users
                (id,name,perm)
                VALUES ($1,$2,$3);`,[json_info.sub,json_info.name||json_info.sub,1]);
        }
        const session_id=(await client.query(`INSERT INTO session
                (userid,perm)
                VALUES ($1,$2)
                RETURNING *;`,[json_info.sub,Math.max(oidc_client[0].perm||1,user_info[0]?.perm||1)])).rows;
        res.cookie('session_id',session_id[0].uuid,{httpOnly:true});
        client.query("COMMIT;");
        return res.redirect(oidc_client[0].frontend||'/');
    }
    catch(err)
    {
        client.query("ROLLBACK;");
        console.error('OIDC callback error:', err.message);
        res.status(500).send(err.message);
    }
    finally
    {
        client.release();
    }
});
authRouter.post("/logout", async (req, res) => {
    try
    {
        await db.query(`DELETE FROM session WHERE uuid=$1;`,[req.cookies.session_id]);
        res.clearCookie('session_id');
        res.send("Success");
    }
    catch(err)
    {
        res.status(401).send("Not authorized");
    }
});
authRouter.post("/token", async (req, res) => {
    const token=process.env.TOKEN;
    try
    {
        if(!token)
        {
            return res.status(403).send("Token disabled");
        }
        if(!req.body.token)
        {
            return res.status(401).send("No token provided");
        }
        if(req.body.token!==token)
        {
            return res.status(403).send("Token invalid");
        }
        const user_info=(await db.query("SELECT * FROM users WHERE id=$1;",["token"])).rows;
        if(user_info.length<=0)
        {
            await db.query(`INSERT INTO users
                (id,name,perm)
                VALUES ($1,$2,$3);`,["token","token",2]);
        }
        const session_id=(await db.query(`INSERT INTO session
                (userid,perm)
                VALUES ($1,$2)
                RETURNING *;`,["token",2])).rows;
        res.cookie('session_id',session_id[0].uuid,{httpOnly:true});
        return res.send("Success");
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
export function checkSession(level)
{
    return async function(req, res, next)
    {
        if(!level)
        {
            next();
        }
        try
        {
            const session=req.cookies.session_id;
            if(!session)
            {
                return res.status(403).send("Not authorized");
            }
            const session_info=(await db.query(`SELECT * FROM session WHERE uuid=$1`,[session])).rows;
            if(session_info.length<=0)
            {
                return res.status(403).send("Not authorized");
            }
            if(session_info[0].perm>=level)
            {
                req.sessionPerm=session_info[0].perm;
                next();
            }
            else
            {
                return res.status(403).send("Permission denied");
            }
        }
        catch(err)
        {
            res.status(500).send(err.message);
        }
    }
}
authRouter.get("/check", checkSession(1), (req, res) => {
    res.json({ perm: req.sessionPerm });
});