const express = require('express');
const {MongoClient, ObjectId} = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

const app = express();



app.use(cors());
app.use(express.json());
app.set('json spaces', 3);

app.use((req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url} - IP: ${req.ip}`); 
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`);
        console.log('-'.repeat(50));
    });
    next();
});

app.use('images', express.static('images'));


const uri = "mongodb+srv://ks1751:Olaoluwa88@cluster0.kyiza.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB Atlas URI
const client = new MongoClient(uri);
let db;
  
client
    .connect()
    .then(() => {
      db = client.db('Database1');
      console.log('Connected to MongoDB Atlas');
    })
    .catch((err) => console.error('MongoDB Connection Error:', err)
);

app.get('/lessons', async (req, res) => {
    try {
      const lessons = await db.collection('Lessons').find().toArray();
      res.json(lessons);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

app.get('/api/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        const lesson = await db.collection('Lessons').findOne({ _id: new ObjectId(lessonId) });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order= {
            customerName: req.body.name,
            phoneNumber: req.body.phoneNumber,
            lessonsIds: req.body.lessonId.map(id => new ObjectId(id)),
            Spaces: req.body.spaces,
        };

        const dbResult = await db.collection('Orders').insertOne(order);
        res.status(201).json({ ...order, _id: dbResult.insertedId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const result = await db.collection('Lessons').updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: req.body }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        const updatedLesson = await db.collection('Lessons').findOne(
            { _id: new ObjectId(lessonId) }
        );
        res.status(200).json(updatedLesson);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

app.get('/search', async (req, res) => {
    try {
        const query = req.query.q?.toLowerCase();  // Get the search query from the URL parameter
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required." });
        }
        const lessons = await db.collection('Lessons').find({ 
            $or: [
            {subject: { $regex: query, $options: 'i' }}, {location: { $regex: query, $options: 'i'}} ]
            }).toArray();
        res.json(lessons);
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ message: 'Error fetching lessons from the database' });
    }
});

app.listen(PORT, () =>{
    console.log(`Server is running on http:localhost:${PORT}`);
});
