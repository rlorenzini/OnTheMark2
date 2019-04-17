const express = require('express'),
  mustacheExpress = require('mustache-express'),
  bodyParser = require('body-parser'),
  server = express(),
  port = process.env.PORT || 8080,
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
  saveUninitialized: false
}))

server.get('/home', (req, res) => {
  res.render('home')
})
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
  console.log(req.body.latitude + "This right here")
  let latitude = req.body.latitude
  let longitude = req.body.longitude
  res.json({ longitude: longitude, latitude: latitude })
})
function validateAdmin(req, res, next) {
  if (req.session.user.admin == true) {
    console.log(req.session.admin)
    next()
  } else {
    console.log(req.session.admin)
    res.redirect('/user-page')
  }
}
function validateLogin(req, res, next) {
  console.log(req.session)
  if (req.session.user) {
    next()
  } else {
    // console.log('user path')

    res.redirect('/login')

  }
}

// server.all('/*', validateLogin, (req, res, next) => {
//   next()
// })

server.get('/', (req, res) => {
  // console.log(req.session)
  res.render('home')
})


let storedCoordinates = []
server.get('/register', (req, res) => {
  res.render('register')
})

server.get('/user-page', adminLinkCheck, validateLogin, (req, res) => { })
// MUST HAVE THIS LINE! Can't get coordinates to DB without it 
// server.get('/admin', (req, res) => {
//   res.render('admin', { persistedUser: req.session.user })
// })

server.post('/register', (req, res) => {
  // console.log("Hello")
  let username = req.body.username
  let password = req.body.password
  let userRegEx = RegExp('([a-zA-Z0-9]{6,20})$')
  //username can contain a-z, A-Z, and 0-9, and has to be between
  //six and twenty digits

  let pwdRegEx = RegExp('(?!^[0-9]*$)(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{8,10})$')
  //password CANNOT start with a number
  //password CANNOT be just letters
  //password must contain one lowercase letter, one uppercase letter, one number,
  //and must be between eight to ten digits long
  if (pwdRegEx.test(password) == true && userRegEx.test(username) == true) {
    console.log("success")
    models.User.findOne({
      where: { username: username, }
    }).then((user) => {
      if (user) {
        // console.log("failed")
        res.render('register', { message: "User name already exists!" })
      } else {
        bcrypt.hash(password, SALT_ROUNDS, function (error, hash) {
          if (error == null) {
            let user = models.User.build({
              username: username,
              password: hash
            })
            user.save().then((savedUser) => {
              // console.log(savedUser)
            }).then(() => {
              res.redirect('/login')
            })
          }
        })
      }
    })

  } else {
    let message = "Username or password is incorrect! Username must be 6-20 characters. Password must be 6-10 characters with one uppercase and lowercase letter and a number."
    res.render('register', { message: message })
  }
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
                // console.log(persistedUser.username)
                // console.log(persistedUser.id)
              }
            }
          } else {
            persistedUser = user
            if (persistedUser) {
              if (req.session) {
                req.session.user = persistedUser
                //adding user id to hidden input here
                res.redirect('/user-page')
                // console.log(persistedUser.username)
                // console.log(persistedUser.id)
              }
            }
          }
          var hour = 3600000
          req.session.cookie.expires = new Date(Date.now() + hour)
          req.session.cookie.maxAge = hour

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

server.get('/admin', validateLogin, validateAdmin, (req, res) => {
  models.Complaint.findAll()
    .then((result) => {
      res.render('admin', { result: result, persistedUser: req.session.user, headerCat: "All Complaints" })
    })
})


server.post('/filter', (req, res) => {
  let category = req.body.category
  if (category == "view_all") {
    models.Complaint.findAll()
      .then((result) => {
        console.log(result)
        //styles the header for sorting
        let styledCat = styleCategory(category)
        res.render('admin', {
          result: result,
          headerCat: styledCat
        })
      })
  } else {
    models.Complaint.findAll({
      where: {
        category: category
      }
    }).then((result) => {
      console.log(result)
      //styles the header for sorting
      let styledCat = styleCategory(category)
      res.render('admin', {
        result: result,
        headerCat: styledCat
      })
    })
  }
})

server.post('/submit-complaint', (req, res) => {
  console.log(req.body.lat == "")
  console.log(req.body.long == "")
  let category = req.body.category
  let description = req.body.description
  let userid = req.body.id
  let lat = req.body.lat
  let long = req.body.long
  if (lat == '' || long == '') {

    persistedUser.message = "Please provide coordinates."
    //========== NEW ADMIN LINK CODE =================
    let check = req.session.user.admin
    if (check) {
      persistedUser.adminlink = true

    }
    // =========== END ==================
    res.render('user-page', { persistedUser: persistedUser })
  }
  else {
    lat = parseFloat(lat)
    long = parseFloat(long)
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
      // ================ NEW ADMIN LINK CODE ==============
      let check = req.session.user.admin
      if (check) {
        persistedUser.adminlink = true
      }
      // ================ END ========================
      res.render('user-page', { persistedUser: persistedUser })
    })
  }

})
server.get('/submit-complaint', (req, res) => {
  res.redirect('user-page')
})

server.post('/delete', (req, res) => {
  deleteID = req.body.id
  let category = req.body.category
  models.Complaint.destroy({
    where: {
      id: deleteID
    }
  }).then(() => {
    res.redirect('/admin')
  })

})

server.get('/my-complaints', (req, res) => {
  let userid = req.session.user.id
  let check = req.session.user.admin
  if (check) {
    persistedUser.adminlink = true
  }
  models.User.findByPk(userid, {
    include: [{
      model: models.Complaint,
      as: 'complaints'
    }]
  }).then((result) => {
    res.render('my-complaints', {
      persistedUser: persistedUser,
      result: result
    })

  })
})

// server.use(function (req, res, next) {
//   res.status(404).send("Sorry can't find that!")
// });

function styleCategory(category) {
  let result = ""
  switch (category) {
    case "view_all":
      result = "All Complaints"
      break;
    case "signal_problem":
      result = "Signal Problem Complaints"
      break;
    case "pothole":
      result = "Pothole Complaints"
      break;
    case "flooding":
      result = "Flooding Complaints"
      break;
    case "street_light":
      result = "Street Light Complaints"
      break;
    case "missing_sign":
      result = "Missing Sign Complaints"
      break;
    case "faded_markings":
      result = "Faded Road Marking Complaints"
      break;

    default:
      break;
  }
  return result
}
//  ======= MIDDLEWARE ADMIN LINK FUNCTION ====
function adminLinkCheck(req, res, next) {
  let check = req.session.user.admin
  let userid = req.session.user.id
  console.log(userid)
  if (check) {
    console.log("TRUE")
    persistedUser = req.session.user
    persistedUser.adminLink = true

    res.render('user-page', {
      persistedUser: persistedUser
    })
  } else {
    console.log("FALSE")
    persistedUser = req.session.user
    res.render('user-page', {
      persistedUser: persistedUser
    })
  }
}

function getUserComplaints(req, res, next) {
  let userid = req.session.user.id
  models.User.findByPk(userid, {
    include: [{
      model: models.Complaint,
      as: 'complaints'
    }]
  }).then((result) => {
    res.render('user-page', {
      persistedUser: persistedUser,
      result: result
    })

  })
}
//============= API REQUEST ====================
server.get('/api',(req,res)=>{

    models.Complaint.findAll().then((result) => {
      res.json(result)
      console.log(result)
    })
})
//remember to install JSONView chrome extension
//result is the array; result[i].Complaint.VALUE

// ============ NEW CODE ENDS HERE =============
server.listen(port, () => { console.log(`Server is running on port ${port}.`) })
