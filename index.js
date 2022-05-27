const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wandg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('pro_paint').collection('tools');
        const orderCollection = client.db('pro_paint').collection('orders');
        const userCollection = client.db('pro_paint').collection('user');

        app.get('/product', async(req, res) =>{
            const query = {};
            const cursor = productCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.put('/user/:email', async(req, res) =>{
          const email = req.params.email;
          const user = req.body;
          const filter = {email: email};
          const options = { upsert : true};
          const updateDoc ={
          $set: user,   
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        res.send(result);

        });


        app.get('/product/:id', async(req, res)=>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);

        });

        app.get('/order', async(req, res) =>{
          const orderEmail = req.query.orderEmail;
          const query = {orderEmail: orderEmail};
          const orders = await orderCollection.find(query).toArray();
          res.send(orders);

        })

        app.post('/order', async(req, res)=>{
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result);
        })

        
    }
    finally{

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello proPaint!')
})

app.listen(port, () => {
  console.log(`propaint listening on port ${port}`)
})