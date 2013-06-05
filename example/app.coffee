express = require "express"
http    = require "http"
path    = require "path"

app = express()

## all environments
app.set "port", process.env.PORT || 3000
app.set "views", __dirname + "/views"
app.set "view engine", "jade"
app.use express.favicon()
app.use express.logger("tiny")
app.use express.bodyParser()
app.use express.methodOverride()
app.use app.router
app.use express.static(path.join(__dirname, "public"))

## development only
if "development" is app.get("env")
  app.use express.errorHandler()

app.get "/", (req, res) ->
  res.render "index", title: "HashCash Example"

app.get "/js/hashcash.js", (req, res) ->
  res.sendfile("browser/hashcash.js", root: path.join(__dirname, ".."))

app.get "/js/hashcash_worker.js", (req, res) ->
  res.sendfile("browser/hashcash_worker.js", root: path.join(__dirname, ".."))

http.createServer(app).listen app.get("port"), ->
  console.log "Express server listening on port #{app.get "port"}"
