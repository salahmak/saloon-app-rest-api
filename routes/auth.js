const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid')

const { validateLogin, validateRegister } = require('../validation/validation.js')



router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let usersCollection = req.app.db.collection('users');
    let authCollection = req.app.db.collection('auth')
    try {
        //validate the user obj
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).json(error.details[0].message);

        //check if the email exists
        const userExists = await usersCollection.findOne({ email: email })
        if (!userExists) return res.status(400).json('email doesnt exist');

        //check if pw is correct
        const { hash } = await authCollection.findOne({ id: userExists.id })
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



router.post('/register', async (req, res) => {
    let usersCollection = req.app.db.collection('users');
    let authCollection = req.app.db.collection('auth')
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
        const userExists = await usersCollection.findOne({ email });
        if (userExists) return res.json("there is an existing user with that email");

        //hash the password
        const hash = await bcrypt.hash(password, 10);


        //add user to database

        await usersCollection.insertOne(user)
        await authCollection.insertOne({ id: user.id, hash })
        const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).json(token)

    }
    catch (err) {
        res.status(400).json("")
    }
})

module.exports = router