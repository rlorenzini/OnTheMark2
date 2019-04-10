const express = require('express'),
  mustacheExpress = require('mustache-express'),
  bodyParser = require('body-parser'),
  server = express(),
  port = 3000,
  path = require('path'),
  router = express.Router(),
  models = require('./models'),
  bcrypt = require('bcrypt'),
  SALT_ROUNDS = 10,
  session = require('express-session')
VIEWS_PATH = path.join(__dirname, '/views');

server.use(session({
  secret: "fmgffndmf",
  resave: false,
  saveUninitialized: true
}))


server.get('/complaints', (req, res) => {
  res.render('complaints')
})

let persistedUser = {}
//let complaints= []

//res.render('complaint', {users: complaint  })

console.log(VIEWS_PATH)
var cors = require('cors')
server.use(cors())
server.use(express.static("public"))

server.use(bodyParser.urlencoded({ extended: false }))
// server.use('/leaflet', leafletRoutes)
server.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials', '.mustache'))
server.set('views', './views')
server.set('view engine', 'mustache')

let storedCoordinates = []
server.get('/register', (req, res) => {
  res.render('register')
})

server.post('/register', (req, res) => {
  console.log("Hello")
  let username = req.body.username
  let password = req.body.password


  // server.get('/register',(req,res)=> {
  //   res.render("register")
  // commented out for some reason?

  models.User.findOne({
    where: { username: username, }
  }).then((user) => {
    if (user) {
      console.log("failed")
      res.render('register', { message: "User name already exists!" })
    } else {
      bcrypt.hash(password, SALT_ROUNDS, function (error, hash) {
        if (error == null) {
          let user = models.User.build({
            username: username,
            password: hash
          })
          user.save().then((savedUser) => {
            console.log(savedUser)
          }).then(() => {
            res.redirect('/login')
          })
        }
      })
    }
  })
})

server.get('/login', (req, res) => {
  res.render("login")

})
//============ New Authorization code =============
server.post('/login', (req, res) => {

  let username = req.body.username
  let password = req.body.password



  models.User.findOne({
    where: {
      username: username
    }
  }).then((user) => {
    console.log(user.password)
    if (user) { //check for user password
      bcrypt.compare(password, user.password, (error, result) => {
        if (result) {
          persistedUser = user
          if (persistedUser) {
            if (req.session) {
              req.session.username = persistedUser.username
              //adding user id to hidden input here
              res.render('complaints', { persistedUser: persistedUser })
              console.log(persistedUser.username)
              console.log(persistedUser.id)
            }
          }
          // check for admin
          // if (user.admin == true) // render admin page

        } else {
          res.render('login', { message: "Invalid username or password." })
        }
      })
    }
  }).catch(() => {
    res.render('login', { message: "Invalid username or password. Please Register" })
  })

})

server.get('/user-page', (req, res) => {
  res.render('user-page')

})

//logout code

server.get('/user-PageDemo', (req, res) => {
  res.render('user-PageDemo')

})
server.post('/logout', (req, res) => {
  req.session.destroy()
  console.log("route working")
  res.render("login")
})

server.post('/complaints', (req, res) => {
  console.log(req.body.complaints)
})

server.get('/admin', (req, res) => {
  models.Complaint.findAll()
    .then((result) => {
      res.render('admin', { result: result })
    })
})


server.post('/filter', (req, res) => {
  let category = req.body.category
  models.Complaint.findAll({
    where: {
      category: category
    }
  }).then((result) => {
    console.log(result)
    res.render('admin', { result: result })
  })
})

server.post('/submit-complaint', (req, res) => {
  let category = req.body.category
  let lat = req.body.lat
  let long = req.body.long
  let description = req.body.description
  let userid = req.body.id
  let complaint = models.Complaint.build({
    category: category,
    lat: lat,
    long: long,
    description: description,
    userid: userid
  })
  complaint.save().then((savedComplaint) => {
    // console.log(savedComplaint)
  }).then(() => {
    persistedUser.message = "You're complaint has successfully been submitted. The city of Houston thanks you."
    res.render('complaints', { persistedUser: persistedUser })
  })

})

server.post('/delete', (req, res) => {
  deleteID = req.body.id
  models.Complaint.destroy({
    where: {
      id: deleteID
    }
  }).then(() => {
    res.redirect('/admin')
  })
})

// ============ NEW CODE ENDS HERE =============
server.listen(port, () => { console.log(`Server is running on port ${port}.`) })
