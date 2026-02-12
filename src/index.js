import express from "express";
import fs from "fs";
const app = express();
const port = process.env.port || 3000;
app.use(express.json());
app.get("/api/getjson", (req, res) => {
    fs.readFile("data/server-list.json", (err, data) => {
        if(err)
        {
            console.log(err);
            res.status(500).send(err.message);
            return;
        }
        res.send(data);
    });
});
app.post("/api/edit", (req, res) => {
    console.log("content-type:", req.headers["content-type"]);
    console.log("body:", req.body);
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
app.use((req, res) => {
    res.status(404).send('Not found');
});
let server=app.listen(port, () => {
    console.log("Server started on port " + port);
});
server.on("error", console.error);