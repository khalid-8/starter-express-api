const api = require("express")
const router = api.Router()
const {sendWarning} = require("./sendMail")
const cors = require('cors')
const {auth, admin} = require('./firebase')
const fs = require('fs')

var whitelist = ['https://khalid-8.github.io','https://khalid-8.github.io/SAMCO_PROD_LINE_DASHBOARD']

var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
            console.log("OLE")
        } else {
            callback(new Error(`Not allowed by CORS from origin: ${origin}`))
        }
    },
    //origin: "https://khalid-8.github.io/SAMCO_PROD_LINE_DASHBOARD",
    optionsSuccessStatus: 200 // For legacy browser support
}


router.use(api.json())

router.use(cors(corsOptions))


router.post('/send_email', async(req, res) => {
    try {
        if (!req.body?.email | !req.body?.line | !req.body?.subject | !req.body?.msg) return res.status(403).send("some data was missing") 
        const {email, subject, msg} = req.body
        await sendWarning(email, line, subject, msg)
        res.status(200).send("email was sent")
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})


const verifyAuth = async(req, res, next) =>{
    // const cookies = getcookie()
    // return next()
    console.log(req.headers['authorization'])
    const idToken = req.headers['authorization']? req.headers['authorization'].split(' ')[1] : null

    if (!idToken){
        next(new Error("no auth present"))
        //return res.status(401).send("no auth present")
    }

    try{
        const authToken = await auth.verifyIdToken(idToken)
        if (!authToken) return next(new Error("Couldn't Verify Auth Token")) //res.status(401).send("Couldn't Verify Auth Token")
        if (!authToken.admin || !authToken.approved) return next(new Error("User Unauthorized to access resources")) //res.status(403).send("User's is not allowed to access this resours")
        next()
    }catch(err){
        console.log(err.message)
        return next(new Error("Couldn't Verify Auth Token"))  //res.status(401).send("Couldn't Verify Auth Token")
    }
}

router.use(verifyAuth)

const addAdmin = async (data, context) => {
    const user = await auth.getUserByEmail(data.email)
    console.log(user)
    if (!user) throw new Error("couldn't find user")
    auth.setCustomUserClaims(user.uid, {
        admin: false
    }).then(() => {
        console.log("******* ADDED AS ADMIN ******")
        return `user ${data.email} had been made an admin!`
    }).catch((err) => {
        return err
    })
}

router.get('/getAll_users', (req, res) => {
    console.log("runnin")
    auth.listUsers(1000)
    .then((listUsersResult) => {
        console.log("listUsersResult"+ JSON.stringify(listUsersResult))
        const users = listUsersResult.users.map((userRecord) => {
            if (userRecord.customClaims)
            console.log(userRecord.customClaims.admin)
            return userRecord.toJSON()
        });
        console.log(users)
        res.send(users)
    })
    .catch((error) => {
        console.log('Error listing users:', error);
        res.sendStatus(500).send("an Error Occoured")
    });
})

router.put('/approve_user', async(req, res) => {
    // console.log(req.body.admin)
    if (!req.body?.uid || req.body?.approve === undefined || !req.body?.email) return res.status(403).send("No user id was provided")
    const isapprove = req.body.approve 

    const user = await auth.getUserByEmail(req.body.email)

    if (!user) return res.status(404).send("user was not Found")

    let claims = user?.customClaims ? user.customClaims : {}
    claims["approved"] = isapprove
    // console.log(user?.customClaims)
    // console.log(claims)
    return auth.setCustomUserClaims(req.body.uid, claims).then(async() => {
        console.log(`******* Approved new User ******`)
        await auth.revokeRefreshTokens(req.body.uid)
        res.status(200).send(`user ${req.body.uid} had been Approved`)
    }).catch((err) => {
        console.log("Encotred this ERROR: ", err)
        res.status(500).send("Couldn't Approve new user")
    })
})

router.put('/production', async(req, res) => {
    if (!req.body?.uid || req.body?.production === undefined || !req.body?.email) return res.status(403).send("No user id was provided")
    const isadmin = req.body.production 

    const user = await auth.getUserByEmail(req.body.email)

    let claims = user?.customClaims ? user.customClaims : {}
    claims["production"] = isadmin

    return auth.setCustomUserClaims(req.body.uid, claims).then(() => {
        console.log(`******* ADDED AS ADMIN: ${isadmin} ******`)
        res.status(200).send(`user ${req.body.uid} had been made an ${isadmin? "admin":"user"}!`)
    }).catch((err) => {
        console.log("Encotred this ERROR: ", err)
        res.status(500).send("Couldn't elevate user privileges")
    })
})

router.put('/admin', async(req, res) => {
    // console.log(req.body.admin)
    if (!req.body?.uid || req.body?.admin === undefined || !req.body?.email) return res.status(403).send("No user id was provided")
    const isadmin = req.body.admin 

    const user = await auth.getUserByEmail(req.body.email)

    let claims = user?.customClaims ? user.customClaims : {}
    claims["admin"] = isadmin

    return auth.setCustomUserClaims(req.body.uid, claims).then(() => {
        console.log(`******* ADDED AS ADMIN: ${isadmin} ******`)
        res.status(200).send(`user ${req.body.uid} had been made an ${isadmin? "admin":"user"}!`)
    }).catch((err) => {
        console.log("Encotred this ERROR: ", err)
        res.status(500).send("Couldn't elevate user privileges")
    })
})

router.put('/planner', async(req, res) => {
    // console.log(req.body.admin)
    if (!req.body?.uid || req.body?.planner === undefined || !req.body?.email) return res.status(403).send("No user id was provided")
    const isadmin = req.body.planner 

    const user = await auth.getUserByEmail(req.body.email)

    let claims = user?.customClaims ? user.customClaims : {}
    claims["planner"] = isadmin

    return auth.setCustomUserClaims(req.body.uid, claims).then(() => {
        console.log(`******* ADDED AS ADMIN: ${isadmin} ******`)
        res.status(200).send(`user ${req.body.uid} had been made an ${isadmin? "admin":"user"}!`)
    }).catch((err) => {
        console.log("Encotred this ERROR: ", err)
        res.status(500).send("Couldn't elevate user privileges")
    })
})

router.delete('/deleteuser', async(req, res) => {
    const uid = req.body.uid
    if(!uid) return res.status(403).send("no user id was provided")
    await auth.deleteUser(uid)
        .then(() => {
            console.log('Successfully deleted user');
            res.status(204).send('Successfully deleted user')
        })
        .catch((error) => {
            console.log('Error deleting user:', error);
            res.status(500).send(`Error deleting user ${uid}`)
        });
})

router.delete('/deletefolder', async(req, res) => {
    try {
        console.log(req.body)
        const folderName = req.body.folder
        // console.log(folderName)

        const bucket = admin.storage().bucket();
        
        await bucket.deleteFiles({prefix: folderName})

        // await bucket.file(folderName).delete()

        console.log("file Deleted")
        res.status(204).send(`folder:${folderName} has been delete`)
        
    } catch (err) {
        console.log(err)
            res.status(500).send("Coludn't delete the file")
    }
})

router.delete('/deletefile', async(req, res) => {
    const fileName = req.body.file

    if(!fileName) return res.status(403).send("no file name is provided")
    const bucket = admin.storage().bucket();

    await bucket.file(fileName).delete()
    .then((ans) => {
        res.status(204).send(`folder:${fileName} has been delete`)
    })
    .catch((err) => {
        console.log(err)
        res.status(500).send("Coludn't delete the file")
    })
})

router.post('/token/generate', (req, res) => {
    auth.createCustomToken(req.body.uid)
        .then((customToken) => {
            // Send token back to client
            res.status(200).send(customToken)
        })
        .catch((error) => {
            console.log('Error creating custom token:', error);
            res.status(500).send('Error creating custom token:', error)
        });
})

router.post('/change_password', (req, res) => {
    if (!req.body?.uid || !req.body?.newPass) return res.status(403).send("No user id was provided")
    admin.auth().updateUser(req.body.uid, {
        password: req.body.newPass,
    })
    .then(function(userRecord) {
        console.log("Successfully updated user", userRecord.toJSON());
        res.status(202).send("Successfully updated user")
    })
    .catch(function(error) {
        console.log("Error updating user:", error);
        res.status(500).send("Error updating user")
    });
})

router.post('/signin', (req, res) => {
    admin.auth().sign
    auth.signInWithCustomToken(req.body.token)
    .then((userCredential) => {
        // Signed in
        // const user = userCredential.user;
        // console.log(user)
        // ...
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage)
        // ...
    });
})

module.exports = router