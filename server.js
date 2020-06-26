const express = require('express')
const bodyParser = require('body-parser')
const { nanoid } = require('nanoid')
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('./tokenVerification.js')
require('dotenv').config()
const Joi = require('joi');

const app = express();
app.use(bodyParser.json());


const PORT = process.env.PORT
const DB_URL = process.env.DB_URL
const DB_NAME = process.env.DB_NAME


const dbClient = new MongoClient(DB_URL, { useUnifiedTopology: true })

const validateRegister = (data) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(26).required(),
        mobile: Joi.string().required(),
        address: Joi.string().required(),
        gender: Joi.string().required(),
        profilePic: Joi.string()
    })
    return Joi.validate(data, userSchema)
}

const validateLogin = (data) => {
    const userSchema = Joi.object({
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(26).required()
    })
    return Joi.validate(data, userSchema)
}

const validateUser = (data) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().max(40).required(),
        mobile: Joi.string().required(),
        address: Joi.string().required(),
        gender: Joi.string().required(),
        profilePic: Joi.string()
    })
    return Joi.validate(data, userSchema)
}

const validateSaloon = (data) => {
    const saloonSchema = Joi.object({
        ownerId: Joi.string().required(),
        name: Joi.string().required(),
        address: Joi.object().keys({
            lat: Joi.number().required(),
            lng: Joi.number().required()
        }),
        services: Joi.array().items(Joi.string()).min(1).required(),
        pictures: Joi.array().items(Joi.string()).min(1).required()
    })
    return Joi.validate(data, saloonSchema)
}



let db;

dbClient.connect().then(client => {
    db = client.db(DB_NAME)
    console.log("connected to db")
}).catch(console.log)




app.get('/', (req, res) => {
    res.send('server is running')
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        //validate the user obj
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).json(error.details[0].message);

        //check if the email exists
        const userExists = await db.collection('users').findOne({ email: email })
        if (!userExists) return res.status(400).json('email doesnt exist');

        //check if pw is correct
        const { hash } = await db.collection('auth').findOne({ id: userExists.id })
        const isValid = await bcrypt.compare(password, hash)
        if (!isValid) return res.status(400).json('invalid pw')

        //create and send a token
        const token = jwt.sign({ id: userExists.id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).json(token)
    }
    catch (err) {
        res.status(400).json('there was an error while signing you in')
    }
})

app.post('/register', async (req, res) => {
    const { name, email, password, mobile, address, gender, profilePic } = req.body;
    const user = {  //user object
        id: nanoid(),
        name,
        email,
        mobile,
        address,
        gender,
        profilePic
    };

    try {
        //validating data before registering
        const { error } = validateRegister(req.body);
        if (error) return res.status(400).json(error.details[0].message)

        //checking if the email already exists
        const userExists = await db.collection('users').findOne({ email });
        if (userExists) return res.json("there is an existing user with that email");

        //hash the password
        const hash = await bcrypt.hash(password, 10);


        //add user to database

        await db.collection('users').insertOne(user)
        await db.collection('auth').insertOne({ id: user.id, hash })
        const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).json(token)

    }
    catch (err) {
        res.status(400).json("")
    }
})

app.put('/editUser', verifyToken, async (req, res) => {
    const { id, name, email, mobile, gender, address, profilePic } = req.body;
    if (req.user.id !== id) return res.status(401).json('you are not allowed to access this user info');

    try {
        const { error } = validateUser({ name, email, mobile, gender, address, profilePic });
        if (error) return res.status(400).json(error.details[0].message);

        const user = await db.collection('users').findOne({ id });
        if (!user) return res.status(400).json('user not found');

        await db.collection('users').findOneAndReplace({ id }, req.body, { returnNewDocument: true })
        res.json(req.body)
    }
    catch (err) {
        res.status(400).json('there was an error while editing the user profile')
        console.log(err.stack)
    }
})

app.get('/getUser/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.id !== id) return res.status(401).json('you are not allowed to access this user info');


    try {
        const user = await db.collection('users').findOne({ id }) //find the user in the db
        if (user) {
            res.json(user) //if the user exists, send his data to the frontend
        } else {
            res.status(404).json('user not found') //otherwise send an err status
        }
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json('there was an error getting the user data')
    }

})

app.post('/newSaloon', verifyToken, async (req, res) => {
    const { ownerId, name, address, services, pictures } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to create a saloon')

    const saloon = { //saloon object
        id: nanoid(25),
        ownerId, name, address, services, pictures
    };

    try {
        const owner = await db.collection('users').findOne({ id: ownerId }) //check if the owner exists in db
        if (owner) { //if ownerUID is correct:
            const { error } = validateSaloon(req.body) //validate provided data
            if (error) return res.status(400).json(error.details[0].message)

            await db.collection('saloons').insertOne(saloon) //and create the saloon and store in db
            res.json(saloon) //send the saloon object to the frontend
        } else {
            res.status(404).json('user not found! please check your info or try again later') //exception if the ownerUid is not correct
        }

    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json('there was an error while creating the saloon.')
    }
})

app.get('/getSaloons', verifyToken, async (req, res) => {
    try {
        const saloons = await db.collection('saloons').find().toArray(); //get saloons from db and convert to an aray
        res.json(saloons) //send the array of saloons to the frontend
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json('there was an error while fetching saloons')
    }
})

app.put('/editSaloon', verifyToken, async (req, res) => {
    const { id, ownerId, name, address, services, pictures } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to edit this saloon')

    try {
        //validate provided data
        const { error } = validateSaloon({ ownerId, name, address, services, pictures })
        if (error) return res.status(400).json(error.details[0].message)

        //check if the saloon exists before modifying
        const saloonExists = await db.collection('saloons').findOne({ id });
        if (!saloonExists) return res.status(400).json('saloon not found')

        await db.collection('saloons').findOneAndReplace({ id }, req.body, { returnNewDocument: true })
        res.json(req.body)
    }
    catch (err) {
        console.log(err.stack);
        res.status(400).json('there was an error while editing the saloon')
    }
})

app.delete('/deleteSaloon', verifyToken, async (req, res) => {
    const { id, ownerId } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to delete this saloon')

    try {
        const saloon = await db.collection('saloons').findOne({ id });
        if (saloon) {
            await db.collection('saloons').findOneAndDelete({ id })
            res.json('Saloon has been deleted successfully')
        } else {
            res.status(404).json('Saloon not found, please verify and try again')
        }
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json('there was an error whil deleting the saloon')
    }
})




app.listen(PORT, () => {
    console.log(`app is listening at http://localhost:${PORT}`)
})