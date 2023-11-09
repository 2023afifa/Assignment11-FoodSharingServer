const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
    origin: [ "https://foodsharing-d0b61.web.app/", "http://localhost:5173"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.etbjr0z.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const logger = async (req, res, next) => {
    console.log("Called: ", req.host, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log("Middleware token verify", token);
    if (!token) {
        return res.status(401).send({ message: "Not authorized" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).send({ message: "unauthorized" });
        }
        console.log("Value in the token", decoded);
        req.user = decoded;
        next();
    })
}

async function run() {
    try {

        // await client.connect();

        const foodCollection = client.db("foodsDB").collection("allfood");
        const userCollection = client.db("foodsDB").collection("user");
        const requestCollection = client.db("foodsDB").collection("request");


        app.post("/jwt", logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
            res
                .cookie("token", token, {
                    httpOnly: true,
                    secure: true,  //https://foodsharing-d0b61.web.app/
                    // sameSite: "none"
                })
                .send({ success: true });
        })

        app.get("/allfood", async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/allfood/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        })

        app.post("/allfood", async (req, res) => {
            const newFood = req.body;
            console.log(newFood);
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })

        app.put("/allfood/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedFood = req.body;
            const food = {
                $set: {
                    name: updatedFood.name,
                    image: updatedFood.image,
                    quantity: updatedFood.quantity,
                    location: updatedFood.location,
                    expired: updatedFood.expired,
                    note: updatedFood.note,
                }
            }

            const result = await foodCollection.updateOne(filter, food, options);
            res.send(result);
        })

        app.delete("/allfood/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/request", async (req, res) => {
            const cursor = requestCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/request/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestCollection.findOne(query);
            res.send(result);
        })

        app.post("/request", async (req, res) => {
            const newRequest = req.body;
            console.log(newRequest);
            const result = await requestCollection.insertOne(newRequest);
            res.send(result);
        })

        app.patch("/request/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateStatus = req.body;
            console.log(updateStatus);
            const updateDoc = {
                $set: {
                    status: updateStatus.status
                },
            };
            const result = await requestCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete("/request/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestCollection.deleteOne(query);
            res.send(result);
        })

        app.get("/user", async (req, res) => {
            const cursor = userCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        })

        app.post("/user", async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Food Sharing");
})

app.listen(port, () => {
    console.log(`Food sharing server is on port ${port}`);
})