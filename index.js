const express = require('express');
const sessions = require('express-session');
const path = require('path');
const { Sequelize, where } = require('sequelize');
const port = process.env.PORT || 8080;
const { UserGame, UserGameBiodata } = require("./models")

/**
 * Initialize express framework
 */
const app = express();
app.use(express.static("views")) //Set static directory(s) (folder containing css & assets)
app.set("view engine", "ejs");

/**
 * Initialize session middleware
 */
var session;
const oneDay = 1000 * 60 * 60 * 24; //One day = 1000ms x 60s x 60mins x 24hrs a day
app.use(sessions({
    secret: "1029askjalkj109810923qlskjaksdq0q1-1-",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Initialize ORM and define user object using Sequelize
 */
const sequelize = new Sequelize('project', 'postgres', '', {
    host: 'localhost',
    dialect: 'postgres'
})
const authSeq = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
authSeq();

/*****
 * *****************************************
 * ExpressJS Routing
 * *****************************************
 */

/**
 * Home URL
 */
 app.get('/', (req, res) => {
    session = req.session;
    if (session.userId){
        // res.sendFile(path.join(__dirname, '/web/index.html'));
        res.render('index', {isLoggedIn:true, name:session.user.name});
    } else {
        // res.send("Please login!");
        res.render('index', {isLoggedIn:false});
    }
});

/**
 * Login URL
 */
app.get('/login', (req, res) => {
    session = req.session;
    if (!session.userId){
        res.render("login");
    } else {
        res.redirect('/');
    }
})
app.post('/login', async (req,res) => {
    //Static credentials
    // const email = "mirzanda@gmail.com";
    // const password = "12345678";

    //Dynamic credentials
    const username = req.body.username;
    const password = req.body.password;
    const user = await UserGame.findOne({where: {username, password}})

    if(user){
        const userData = await UserGameBiodata.findOne({where: {id : user.id}})
        session=req.session;
        session.userId=req.body.username;
        session.user=userData;
        console.log(req.session);
        res.send(
            `Succesfully logged in as <b>` + userData.name + `</b> <a href=\'/'>click here to proceed</a>
            <br/>
            <a href=\'/logout'>click here to logout</a>`
        );
    }
    else{
        res.send('Invalid email or password');
    }
})

/**
 * Logout URL
 */
app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

/**
 * Get UserGame ID Data
 */
app.get('/user', (req, res) => {
    session = req.session;
    if (session.userId){
        res.send(session.userId);
    } else {
        res.send('No active user in the current session');
    }
});
app.get('/profile', (req,res) => {
    session = req.session;
    if (session.userId) {
        res.render('profile', {email:session.userId, user:session.user})
    } else {
        res.redirect('/')
    }
})
app.get('/profile/edit', (req, res) => {
    session = req.session;
    if (session.userId) {
        res.render('profile', {email:session.userId, user:session.user})
    } else {
        res.redirect('/')
    }
})
app.post('/profile/edit', async (req, res) => {
    session = req.session;
    if (session.userId) {
        const name = req.body.name;
        const phone = req.body.phone;
        const address = req.body.address;
        const user = await UserGame.findOne({where: {username:session.userId}})
        const userBiodata = await UserGameBiodata.update(
            {name, address, phone},
            {where: {userId:user.id}}
        );
        session.user = userBiodata;
        res.render('profile', {email:session.userId, user:session.user});
    } else {
        res.send('No active user in the current session')
    }
})

/**
 * Get all users
 */
app.get('/users', async (req, res) => {
    const users = await UserGame.findAll()
    res.send(users);
})
/**
 * Create new user
 */
app.post('/users', async (req, res) => {
    const countExist = UserGame.count({where: {username: req.body.password}});
    if (!countExist) {
        const newUser = await UserGame.create(
            {
                username: req.body.username,
                password: req.body.password,
            }
        )
    } else {
        res.send("User already exists with email " + req.body.username)
    }
})
/**
 * Create new user page
 */
 app.get('/signup', (req, res) => {
    const session = req.session;
    if (session.userId) {
        redirect('/');
    } else {
        res.render('signup');
    }
})
app.post('/signup', async (req, res) => {
    const session = req.session;
    if (session.userId) {
        res.send("There is an active user session")
    } else {
        const name = req.body.name;
        const username = req.body.username;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        isUserExists = (await UserGame.findOne({where: {username}}) !== null);

        if (password !== confirmPassword){
            res.send("Password did not match!");
        } else if (isUserExists) {
            res.send(username + " is already used.")
        } else {
            user = await UserGame.create({
                username,
                password
            }).then( user => (
                user.createUserGameBiodatum({
                    name,
                    userId: user.id
                })
            ));
            res.send("Account created with email " + username);
        }

    }
})

/**
 * Game URL
 */
app.get('/rock-paper-scissor-game', (req, res) => {
    session = req.session;
    if (session.userId){ //if session.userId is exists
        // res.sendFile(path.join(__dirname, '/web/rock-paper-scissor-game.html'));
        const userId = session.user.userId;
        const history = UserGameHistory.findAll({where: {userId}});
        res.render('rock-paper-scissor-game', {history})
    } else {
        res.redirect('/')
    }
});
app.post('/rock-paper-scissor-game', async (req, res) => {
    session = req.session;
    if (session.userId){ //if session.userId is exists
        const userId = session.user.userId;
        const playerMove = req.body.playerMove;
        const comMove = req.body.comMove;
        const result = req.body.result;

        await UserGameHistory.create({
            playerMove,
            comMove,
            result,
            userId
        });

        const history = await UserGameHistory.findAll({where: {userId}});
        res.render('rock-paper-scissor-game', {history})
    } else {
        res.redirect('/')
    }
})

/**
 * Run Express on PORT
 */
app.listen(port, () => {
    console.log("Listening on: localhost:" + port + "/");
});