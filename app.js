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
  key: "user_sid",
  secret: "fmgffndmf",
  resave: false,
  saveUninitialized: false
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
server.set('views', VIEWS_PATH)
server.set('view engine', 'mustache')
server.use('/js', express.static('js'))
server.use(bodyParser.json())

// server.get('/save-latlng',(req,res)=>{
//   console.log("anything going on here")
//   res.redirect('/')
// })
server.post('/save-latlng', (req, res) => {
  console.log(req.body.latitude)
  let latitude = req.body.latitude
  let longitude = req.body.longitude
  res.json({ longitude: longitude, latitude: latitude })
})

function validateLogin(req, res, next) {
  console.log(req.session)
  if (req.session.user) {
    console.log('true path')
    next()
  } else {
    console.log('false path')

    res.redirect('/login')
  }
}

// server.all('/*', validateLogin, (req, res, next) => {
//   next()
// })

server.get('/', (req, res) => {
  console.log(req.session)
  res.render('login')
})


let storedCoordinates = []
server.get('/register', (req, res) => {
  res.render('register')
})

server.get('/user-page', validateLogin, (req, res) => {
  res.render('user-page', { persistedUser: req.session.user })
})

// server.get('/admin', (req, res) => {
//   res.render('admin', { persistedUser: req.session.user })
// })

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
          if (user.admin == true) {
            persistedUser = user
            if (persistedUser) {
              if (req.session) {
                req.session.user = persistedUser

                //adding user id to hidden input here
                res.redirect('/admin')
                console.log(persistedUser.username)
                console.log(persistedUser.id)
              }
            }
          } else {
            persistedUser = user
            if (persistedUser) {
              if (req.session) {
                req.session.user = persistedUser
                //adding user id to hidden input here
                res.redirect('/user-page')
                console.log(persistedUser.username)
                console.log(persistedUser.id)
              }
            }
          }
          var hour = 3600000
          req.session.cookie.expires = new Date(Date.now() + hour)
          req.session.cookie.maxAge = hour
          // render admin page

        } else {
          res.render('login', { message: "Invalid username or password." })
        }
      })
    }
  }).catch(() => {
    res.render('login', { message: "Invalid username or password. Please Register" })
  })
})

server.get('/user-page', validateLogin, (req, res) => {
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

server.get('/admin', validateLogin, (req, res) => {
  models.Complaint.findAll()
    .then((result) => {
      res.render('admin', { result: result, persistedUser: req.session.user })
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
  console.log(req.body.lat)
  console.log(req.body.long)
  let category = req.body.category
  let lat = parseFloat(req.body.lat)
  let long = parseFloat(req.body.long)
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
    res.render('user-page', { persistedUser: persistedUser })
  })
})
server.get('/submit-complaint',(req,res)=>{
  res.redirect('user-page')
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

server.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});

// ============ NEW CODE ENDS HERE =============
server.listen(port, () => { console.log(`Server is running on port ${port}.`) })
