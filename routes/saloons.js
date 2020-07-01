const express = require('express')
const router = express.Router();
const { nanoid } = require('nanoid')

const verifyToken = require('../tokenVerification/tokenVerification.js')
const { validateSaloon } = require('../validation/validation.js')




router.post('/new', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const saloonsCollection = req.app.db.collection('saloons');

    const { ownerId, name, address, services, pictures } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to create a saloon')

    //saloon object
    const saloon = { id: nanoid(25), ownerId, name, address, services, pictures };

    try {
        const owner = await usersCollection.findOne({ id: ownerId }) //check if the owner exists in db
        if (owner) { //if ownerUID is correct:
            const { error } = validateSaloon(req.body) //validate provided data
            if (error) return res.status(400).json(error.details[0].message)

            await saloonsCollection.insertOne(saloon) //and create the saloon and store in db
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

router.get('/get', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const saloonsCollection = req.app.db.collection('saloons');
    try {
        const saloons = await saloonsCollection.find().toArray(); //get saloons from db and convert to an aray
        res.json(saloons) //send the array of saloons to the frontend
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json('there was an error while fetching saloons')
    }
})

router.put('/edit', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const saloonsCollection = req.app.db.collection('saloons');
    const { id, ownerId, name, address, services, pictures } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to edit this saloon')

    try {
        //validate provided data
        const { error } = validateSaloon({ ownerId, name, address, services, pictures })
        if (error) return res.status(400).json(error.details[0].message)

        //check if the saloon exists before modifying
        const saloonExists = await saloonsCollection.findOne({ id });
        if (!saloonExists) return res.status(400).json('saloon not found')

        await saloonsCollection.findOneAndReplace({ id }, req.body, { returnNewDocument: true })
        res.json(req.body)
    }
    catch (err) {
        console.log(err.stack);
        res.status(400).json('there was an error while editing the saloon')
    }
})

router.delete('/delete', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const saloonsCollection = req.app.db.collection('saloons');
    const { id, ownerId } = req.body;

    if (req.user.id !== ownerId) return res.status(401).json('you are not allowed to delete this saloon')

    try {
        const saloon = await saloonsCollection.findOne({ id });
        if (saloon) {
            await saloonsCollection.findOneAndDelete({ id })
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


module.exports = router