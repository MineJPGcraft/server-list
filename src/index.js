import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {db,dbinit} from "./db.js";
import cookieParser from "cookie-parser";
import {authRouter,checkSession} from "./auth.js";
import {admin_router} from "./admin.js";
import {oidcConfigRouter} from "./oidc-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8080;
await dbinit();
if(!fs.existsSync("data")) {fs.mkdirSync("data");}
app.use(express.json());
app.use(cookieParser());
app.use('/api/oidcConfig/admin',checkSession(2));
app.use('/api/oidcConfig',oidcConfigRouter);
app.use('/api/auth',authRouter);
app.get("/api/getjson",async (req, res) => {
    try
    {
        let json=((await db.query("SELECT * FROM server;")).rows);
        for(let i = 0; i < json.length; i++)
        {
            json[i].id=i;
        }
        res.json(json);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send(err.message);
    }
});
app.use('/api/admin',checkSession(2));
app.use('/api/admin',admin_router);
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