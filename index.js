const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const req = require('express/lib/request');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wandg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
 const authHeader = req.headers.authorization;
 if(!authHeader){
   return res.status(401).send({message: 'UnAuthorize access'});
 }
 const token = authHeader.split(' ')[1];

 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
   if(err){
     return res.status(403).send({message: 'Forbidden access'})

   } 
   req.decoded = decoded;
   next();
 }) 
   
 
}


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

        app.get('/user', verifyJWT, async(req, res)=>{
          const users = await userCollection.find().toArray();
          res.send(users);
        });


        app.get('/admin/:email', async(req, res)=>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin})
        })

        app.put('/user/admin/:email', verifyJWT, async (req, res) =>{
          const email = req.params.email;
         const requester = req.decoded.email;
         const requesterAccount = await userCollection.findOne({email: requester});
         if(requesterAccount.role === 'admin'){
          const filter = {email: email};
          const updateDoc ={
              $set: {role: 'admin'},   
            };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.send(result);
         }
         else{
           res.status(403).send({message: 'forbidden'})
         }
           
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
        const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET)

        res.send({result, token});

        });


        app.get('/product/:id', async(req, res)=>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);

        });

        app.get('/order', verifyJWT, async(req, res) =>{
          const orderEmail = req.query.orderEmail;
          const decodedEmail = req.decoded.email;
          if(orderEmail === decodedEmail){
            const query = {orderEmail: orderEmail};
            const orders = await orderCollection.find(query).toArray();
            return res.send(orders);
          }
         else{
           return res.status(403).send({message: 'Forbidden access'});
         }

        });

        app.get('/order/:id',verifyJWT, async(req, res)=>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const order = await orderCollection.findOne(query);
          res.send(order);
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