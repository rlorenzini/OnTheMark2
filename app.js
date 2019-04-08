const express = require('express'),
  mustacheExpress = require('mustache-express'),
  bodyParser = require('body-parser'),
  server = express(),
  port = 3000,
  path = require('path'),
  router = express.Router(),
  VIEWS_PATH = path.join(__dirname, '/views');



console.log(VIEWS_PATH)
var cors = require('cors')
server.use(cors())
server.use(express.static("public"))

server.use(bodyParser.urlencoded({extended:false}))
// server.use('/leaflet', leafletRoutes)
server.engine('mustache',mustacheExpress(VIEWS_PATH + '/partials', '.mustache'))
server.set('views','./views')
server.set('view engine','mustache')

let storedCoordinates = []
server.get('/',(req,res)=>{
  res.render('register')
})

// server.get('/register',(req,res)=> {
//   res.render("register")

// })






server.listen(port,()=>{console.log(`Server is running on port ${port}.`)})
