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