import express from "express";
import {db} from "./db.js";
export let oidcConfigRouter=express.Router();
oidcConfigRouter.get("/list",async(req,res)=>
{
    try
    {
        let oidcInfo=(await db.query("SELECT id,redirect_uri,auth_url,name FROM oidc;")).rows;
        res.json(oidcInfo);
    }
    catch(err)
    {
        res.status(500).send(err.message);
    }
});
oidcConfigRouter.get("/admin/list",async(req,res)=>
{
    try
    {
        let oidcInfo=(await db.query("SELECT id,name,secret,perm,frontend,redirect_uri,apipoint,auth_url FROM oidc;")).rows;
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
oidcConfigRouter.post("/admin/edit",async(req,res)=>
{
    try
    {
        if(!req.body.id)
        {
            return res.status(400).send('Missing id');
        }
        const fields=['name','secret','perm','frontend','redirect_uri','apipoint','auth_url'];
        const updates=fields.filter(f=>req.body[f]!==undefined);
        if(updates.length===0)
        {
            return res.status(400).send('No fields to update');
        }
        const setClauses=updates.map((f,i)=>`${f}=$${i+1}`).join(',');
        const values=[...updates.map(f=>req.body[f]),req.body.id];
        const result=await db.query(`UPDATE oidc SET ${setClauses} WHERE id=$${values.length};`,values);
        if(result.rowCount<=0)
        {
            return res.status(404).send('OIDC provider not found');
        }
        res.send('Success.');
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
        const reqs=['id','secret','redirect_uri','apipoint','auth_url','name'];
        if(reqs.filter(i=>!req.body[i]).length>0)
        {
            return res.status(400).send('Missing required fields');
        }
        const result=await db.query(`INSERT INTO oidc
    (id,secret,perm,frontend,redirect_uri,apipoint,auth_url,name)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id;`,[req.body.id,req.body.secret,req.body.perm||null,req.body.frontend||null,req.body.redirect_uri,req.body.apipoint,req.body.auth_url,req.body.name]);
        res.send(result.rows[0].id);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});