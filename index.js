const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();

const port = process.env.PORT || 3000;

// midleWere 

app.use(cors({
  origin:[
       'http://localhost:5173',
      //  'https://car-doctor-server-eta-plum.vercel.app',
      // 'https://car-doctor-10f7f.web.app',
      // 'https://car-doctor-10f7f.firebaseapp.com',
   
  ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser())




console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stvj7tw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middleweres

const logger = async(req,res,next) =>{

  console.log('called',req.host,req.originalUrl)
  next();

}
const varifyToken = (req,res,next) => {
  const token = req?.cookies?.token;

  console.log('token in the middeleWere',token);


  if(!token) {
    return res.status(401).send({message:'Unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=> {
    if(err) {
      return res.status(401).send({message:'Unauthrized access'})
    }
    req.user = decoded;
  })

  next()


}







async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('booking')
    const productCollection = client.db('carDoctor').collection('products')

    //Auth related api

    app.post('/jwt',logger,async(req,res) => {
      const user = req.body;

      console.log(user)

      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'1h'
      });
  
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false

      })





  
      
      .send({success:true});



    })


    // products related 

    app.get('/products',async(req,res) => {

      const result = await productCollection.find().toArray()

      res.send(result);
    })



    // services related 

    app.get('/services',logger,   async (req, res) => {

      const cursor = serviceCollection.find();

      const result = await cursor.toArray();

      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {

      const id = req.params.id;

      const query = { _id: new ObjectId(id) }


      const options = {

        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(query, options);

      res.send(result);



    })

    // booking 

    app.get('/bookings', async (req, res) => {
      

      // console.log(req.query.email)

      // console.log('token ower info',req.user)
      // if( req.user.email  !== req.query.email){
      //   return res.status(403).send({message:'forbiden access'})
      // }

      
      // let query = {};

      // if (req.query?.email) {
      //   query = { email: req.query.email }
      // }


      // const cursor = bookingCollection.find(query);

      // const result = await cursor.toArray();

      // res.send(result)

      const email = req.query.email;

      const query = {email: email}



      const  result = await bookingCollection.find(query).toArray()

      res.send(result)


    })

    app.post('/bookings', async (req, res) => {



      const booking = req.body;

      console.log(booking);

      const result = await bookingCollection.insertOne(booking)
      res.send(result);

    });


    app.patch('/bookings/:id', async (req, res) => {

      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };

      const updateBooking = req.body;

      console.log(updateBooking);

      const updateDoc = {
        $set: {
          status: updateBooking.status
        }

      };

      const result = await bookingCollection.updateOne(filter, updateDoc);

      res.send(result);


    })




    app.delete('/bookings/:id', async (req, res) => {

      const id = req.params.id;

      console.log(id);

      const query = { _id: new ObjectId(id) };

      const result = await bookingCollection.deleteOne(query);

      res.send(result);
    })








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {

  res.send('doctor is running');
})

app.listen(port, () => {

  console.log(`car doctor server is running ${port}`);



})





