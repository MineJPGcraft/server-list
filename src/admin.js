import express from "express";
import {db} from "./db.js";
export const admin_router = express.Router();
admin_router.post("/edit", async(req, res) => {
    try
    {
        const reqs=['name','type','version','icon','description','link','uuid'];
        if(reqs.filter(i=>!req.body[i]).length>0)
        {
            return res.status(400).send('Missing required fields');
        }
        const result=await db.query(`UPDATE server SET
            name=$1,
            type=$2,
            version=$3,
            icon=$4,
            description=$5,
            link=$6,
            IP=$7
        WHERE uuid=$8;`,[req.body.name,req.body.type,req.body.version,req.body.icon,req.body.description,req.body.link,req.body.IP||null,req.body.uuid]);
        if(result.rowCount<=0)
        {
            return res.status(404).send("Server not found");
        }
        res.send("Success.");
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
admin_router.post("/create", async(req, res) => {
    try
    {
        const reqs=['name','type','version','icon','description','link'];
        if(reqs.filter(i=>!req.body[i]).length>0)
        {
            return res.status(400).send('Missing required fields');
        }
        const result=await db.query(`INSERT INTO server
    (name,type,version,icon,description,link,IP)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING uuid;`,[req.body.name,req.body.type,req.body.version,req.body.icon,req.body.description,req.body.link,req.body.IP||null]);
        res.send(result.rows[0].uuid);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
admin_router.post("/delete", async(req, res) => {
    try
    {
        if(!req.body.uuid)
        {
            return res.status(400).send('Missing uuid');
        }
        const result=await db.query("DELETE FROM server WHERE uuid=$1;",[req.body.uuid]);
        if(result.rowCount<=0)
        {
            return res.status(404).send("Server not found");
        }
        res.send("Success.");
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});