import express from "express";
import {db} from "./db.js";
export let oidcConfigRouter=express.Router();
oidcConfigRouter.get("/list",async(req,res)=>
{
    try
    {
        let oidcInfo=db.query("SELECT id,redirect_uri,apipoint FROM oidc;");
        res.json(oidcInfo);
    }
    catch(err)
    {
        res.status(500).send(err.message);
    }
});
oidcConfigRouter.post("/admin/delete",async(req,res)=>
{
    try
    {
        if(!req.body.clientId)
        {
            return res.status(400).send('Missing id');
        }
        const result=await db.query("DELETE FROM oidc WHERE id=$1;",[req.body.clientId]);
        if(result.rowCount<=0)
        {
            return res.status(404).send("Server not found");
        }
        res.send("Success.");
    }
    catch(err)
    {
        res.status(500).send(err.message);
    }
});
oidcConfigRouter.post("/admin/create",async(req,res)=>
{
    try
    {
        const reqs=['id','secret','redirect_uri','apipoint'];
        if(reqs.filter(i=>!req.body[i]).length>0)
        {
            return res.status(400).send('Missing required fields');
        }
        const result=await db.query(`INSERT INTO oidc
    (id,secret,perm,frontend,redirect_uri,apipoint)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id;`,[req.body.id,req.body.secret,req.body.perm||null,req.body.frontend||null,req.body.redirect_uri,req.body.apipoint]);
        res.send(result.rows[0].id);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});