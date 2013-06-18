express = require "express"
tinylr  = require "tiny-lr"
http    = require "http"
path    = require "path"
fs      = require "fs"

app = express()
server = undefined

## all environments
app.set "port", process.env.PORT or 35729
app.set "views", path.join(__dirname, "../views")
app.set "view engine", "jade"
app.use express.favicon()
app.use express.logger("tiny")
app.use express.bodyParser()
app.use express.methodOverride()
app.use app.router
app.use tinylr.middleware app: app
app.use express.static(path.join(__dirname, "../public"))
app.use "/js", express.static(path.join(__dirname, "../../node_modules/when"))
app.use "/js", express.static(path.join(__dirname, "../../node_modules/requirejs"))
app.use "/js/poly", express.static(path.join(__dirname, "../../lib/poly"))
app.use "/js/hashmash", express.static(path.join(__dirname, "../../lib"))

## development only
if "development" is app.get("env")
  app.use express.errorHandler()

app.get "/", (req, res) ->
  res.render "index", title: "HashMash Example", port: app.get("port")

watch = [
  path.join __dirname, "../public/js"
  path.join __dirname, "../.."
  path.join __dirname, "../views"
]

extensions = [ "jade", "js" ]

for watchdir in watch
  fs.watch watchdir, (event, filename) ->
    return unless server?
    extension = filename[filename.lastIndexOf('.') + 1 ..]
    return unless extension in extensions

    http.request(
      hostname: "127.0.0.1"
      port: server.address().port
      path: "/changed?files=#{filename}"
      method: "GET"
    ).end()

module.exports.listen = (port) ->
  app.set "port", port if port?

  port = app.get "port"
  server = app.listen port, ->
    console.log "Example server listening on port #{port}"
