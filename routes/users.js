const express = require('express')
const router = express.Router();

const verifyToken = require('../tokenVerification/tokenVerification.js')
const { validateUser } = require('../validation/validation.js')




router.put('/edit', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const { id, name, email, mobile, gender, address, profilePic } = req.body;
    if (req.user.id !== id) return res.status(401).json('you are not allowed to access this user info');

    try {
        const { error } = validateUser({ name, email, mobile, gender, address, profilePic });
        if (error) return res.status(400).json(error.details[0].message);

        const user = await usersCollection.findOne({ id });
        if (!user) return res.status(400).json('user not found');

        await usersCollection.findOneAndReplace({ id }, req.body, { returnNewDocument: true })
        res.json(req.body)
    }
    catch (err) {
        res.status(400).json('there was an error while editing the user profile')
        console.log(err.stack)
    }
})

router.get('/get/:id', verifyToken, async (req, res) => {
    const usersCollection = req.app.db.collection('users');
    const { id } = req.params;

    if (req.user.id !== id) return res.status(401).json('you are not allowed to access this user info');


    try {
        const user = await usersCollection.findOne({ id }) //find the user in the db
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

module.exports = router