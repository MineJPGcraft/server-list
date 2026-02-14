import express, {json} from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db=new pg.Client({
    user: process.env.DB_USER||'postgres',
    password: process.env.DB_PASSWORD||'password',
    host: process.env.DB_HOST||'localhost',
    port: process.env.DB_PORT||'5432',
    database: process.env.DB_NAME||'serverlist'
});
await db.connect();
await db.query(`CREATE TABLE IF NOT EXISTS server (
    uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    version text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    IP text
)`);
const app = express();
const port = process.env.PORT || 8080;
const token = process.env.TOKEN || 'token';
if(!fs.existsSync("data")) {fs.mkdirSync("data");}
if(!fs.existsSync("data/server-list.json")) fs.copyFileSync("default-data/server-list.json", "data/server-list.json");
app.use(express.json());
app.get("/api/getjson",async (req, res) => {
    try
    {
        let json=((await db.query("SELECT * FROM server;")).rows);
        // let json = JSON.parse(fs.readFileSync("data/server-list.json").toString());
        for(let i = 0; i < json.length; i++)
        {
            json[i].uid=i;
        }
        res.send(JSON.stringify(json, null, 2));
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
app.post("/api/edit", (req, res) => {
    const queryToken=req.headers["authorization"];
    if(!queryToken)
    {
        return res.status(401).send("No token provided");
    }
    if(queryToken!==token)
    {
        return res.status(403).send("Token invalid");
    }
    if (!Array.isArray(req.body)) {
        return res.status(400).send("Body must be JSON array, and Content-Type must be application/json");
    }
    try
    {
        let data=fs.readFileSync("data/server-list.json").toString();
        let json=JSON.parse(data);
        for(let i=0;i<req.body.length;i++)
        {
            let tmp=0;
            for(let j=0;j<json.length;j++)
            {
                if(json[j].id===req.body[i].id)
                {
                    json[j]=req.body[i];
                    tmp=1;
                    break;
                }
            }
            if(tmp!==1)
            {
                json[json.length]=req.body[i];
            }
        }
        fs.writeFileSync("data/server-list.json", JSON.stringify(json, null, 2));
        res.send("Success.");
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
app.post("/api/delete", (req, res) => {
    const queryToken=req.headers["authorization"];
    if(!queryToken)
    {
        return res.status(401).send("No token provided");
    }
    if(queryToken!==token)
    {
        return res.status(403).send("Token invalid");
    }
    try
    {
        let data=fs.readFileSync("data/server-list.json").toString();
        let json=JSON.parse(data);
        let success=0;
        for(let i=0;i<json.length;i++)
        {
            if(json[i].id===req.body.id)
            {
                json.splice(i,1);
                success=1;
                break;
            }
        }
        if(success!==1)
        {
            res.status(400).send("Failed.");
            return;
        }
        fs.writeFileSync("data/server-list.json", JSON.stringify(json, null, 2));
        res.send("Success.");
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
app.get("/api/checkToken", (req, res) => {
    const queryToken=req.headers["authorization"];
    if(!queryToken)
    {
        return res.status(401).send("No token provided");
    }
    if(queryToken!==token)
    {
        return res.status(403).send("Token invalid");
    }
    return res.status(200).send("Success.");
});

// 静态文件服务 - 提供前端构建文件
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback - 所有非API路由返回 index.html
    app.use((req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // 如果没有 dist 目录，返回 404
    app.use((req, res) => {
        res.status(404).send('Not found');
    });
}

let server=app.listen(port, () => {
    console.log("Server started on port " + port);
});
server.on("error", console.error);