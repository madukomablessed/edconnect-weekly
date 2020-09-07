require('dotenv').config();

const mongoose = require('mongoose');
const {
    MongoMemoryServer
} = require('mongodb-memory-server');

const express = require('express');
const childProcess = require("child_process");
const path = require("path");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const session = require('express-session');

const SERVER_PORT = process.env.SERVER_PORT;
const MONGO_PORT = process.env.MONGO_PORT || 27017;
process.env.MONGO_URI = `mongodb://127.0.0.1:${MONGO_PORT}/edconnect`;
const app = express();

app.use('/uploads', express.static('routes/uploads'));

const initApp = async () => {
 
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    app.use(morgan('combined'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(session({
        secret: 'SOmeSEcretSalt!',
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7
        },
        resave: true,
        saveUninitialized: false
    }));

    app.use('/', require('./routes/api'));

    app.listen(SERVER_PORT, () => {
        console.log(`Server running on port ${SERVER_PORT}`)
    });
};

(async () => {
    try {
       const conn =  await mongoose.connect('mongodb://127.0.0.1:27017/edconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        })
       await  conn.connection.close();

    } catch (error) {
        const db = new MongoMemoryServer({
            instance: {
                port: MONGO_PORT,
                dbName: 'edconnect'
            }
        });
        const url = await db.getUri();
    }
})().then(() => {
    childProcess.execSync(`${path.join(__dirname, "../node_modules/.bin/md-seed")} run`);
    initApp();

})