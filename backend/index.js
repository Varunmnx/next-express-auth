const express = require('express')
const morgan = require('morgan')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const PORT = 1234
const SECRET = 'mykey'
const app = express()

app.use(cors({origin:"*"}))
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Fake users
let users = [
    { id: 1, username: 'admin', password: 'password123' }
]

let refreshTokens = []

const extractBearerToken = headerValue => {
    if (typeof headerValue !== 'string') {
        return false
    }

    const matches = headerValue.match(/(bearer)\s+(\S+)/i)
    return matches && matches[2]
}

// The middleware
const checkTokenMiddleware = (req, res, next) => {
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

    if (!token) {
        return res.status(401).json({ message: 'need a token' })
    }

    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'bad token' })
        }
    })

    next()
}

app.post("/refresh", (req, res) => {
    try {
        if(!req.body.refreshToken) {
            return res.status(400).json({ message: 'need a refresh token' })
        }
        const token = req.headers.authorization && extractBearerToken(req.headers.authorization)
        if (!token) {
            return res.status(401).json({ message: 'need a access token' })
        }
        console.log(token)
        jwt.verify(token, SECRET, (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ message: 'bad token' })
            }
            // check if refresh token is valid
            console.log(refreshTokens)
            if(!refreshTokens.includes(req.body.refreshToken)) {
                return res.status(401).json({ message: 'bad token' })
            }
            // generate new access token
            const access_token = jwt.sign({
                sub: decodedToken.sub,
                username: decodedToken.username
            }, SECRET, { expiresIn: '1 hour' })
    
            // generate new refresh token
            const refresh_token = jwt.sign({
                sub: decodedToken.sub,
                username: decodedToken.username
            }, SECRET, { expiresIn: '1 day' })
    
            // remove the old refresh token from the array
            refreshTokens = refreshTokens.filter(t => t !== req.body.refreshToken)
    
            // add new refresh token to the array
            refreshTokens.push(refresh_token)
    
            return res.status(200).json({
                access_token,
                refresh_token: refresh_token
            })
        })
    
        return res.status(200).json({ message: "refreshed" })
    } catch (error) {
        console.error(error)
    } 

})

app.post('/login', (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'enter the correct username and password' })
    }

    const user = users.find(u => u.username === req.body.username && u.password === req.body.password)

    if (!user) {
        return res.status(400).json({ message: 'wrong login or password' })
    }
    
    // short lived access token 
    const token = jwt.sign({
        sub: user.id,
        username: user.username
    }, SECRET, { expiresIn: '3 hours' })
    // long lived refresh token
    const refreshToken = jwt.sign({
        sub: user.id,
        username: user.username
    }, SECRET, { expiresIn: '1 day' })
    // push the lts refresh token to the array
    refreshTokens.push(refreshToken)
    refreshTokens.push(token)
    return res.json({ access_token: token, refresh_token: refreshToken })
})

app.post('/register', (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'please enter username and password' })
    }

    const userExisting = users.find(u => u.username === req.body.username)

    if (userExisting) {
        return res.status(400).json({ message: `user ${req.body.username} already existing` })
    }

    const id = users[users.length - 1].id + 1
    const newUser = {
        id: id,
        username: req.body.username,
        password: req.body.password
    }

    users.push(newUser)

    return res.status(201).json({ message: `user ${id} created`, content: newUser })
})

app.get('/me', checkTokenMiddleware, (req, res) => {
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)
    const decoded = jwt.decode(token, { complete: false })
    return res.json({ content: decoded })
})

app.get('*', (req, res) => {
    return res.status(404).json({ message: 'page not found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})