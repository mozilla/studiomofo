var version = require('./package').version;
var express = require("express");
var handlebars = require("handlebars");
var cons = require("consolidate"); // template engine consolidation library
var http = require("http");
var fs = require('fs');
var path = require('path');
var nodemailer = require("nodemailer");
var mail = nodemailer.mail;
// create reusable transport method (opens pool of SES connections)
var sesTransport = nodemailer.createTransport("SES", {
    AWSAccessKeyID: process.env.AWS_KEY_ID,
    AWSSecretKey: process.env.AWS_SECRET_KEY
});
var app = express();
// using a simple text file to store counter
var counterFile = "counter.txt";

app.configure(function(){
    app.set("view engine", "html");
    app.set("view options", { layout: false });
    app.set("views", __dirname + "/views");
    app.engine("html", cons.handlebars);
    app.use(express.static(__dirname + "/public"));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
});

var viewdir = path.join(__dirname, 'views');
fs.readdirSync(viewdir).forEach(function(filename){
    var ext = path.extname(filename);
    if (filename[0] === '_' && ext === '.html'){
        var filepath = path.join(viewdir, filename);
        var stringtemplate = fs.readFileSync(filepath, 'utf8');
        var templatename = path.basename(filename, ext).slice(1);
        handlebars.registerPartial(templatename, stringtemplate);
        //console.log('registering %s partial: %s characters', templatename, stringtemplate.length);
    }
});

app.get('/', function(req, res){
  res.render("index");
});

app.get('/healthcheck', function(req, res) {
  res.json({
    http: "okay",
    version: version
  });
});

app.post("/requestForm", function(req, res){
    // FIXME: check environment type, temp solution, to be fixed by checking env var
    var host = req.get("host");
    var onStaging = host.indexOf("staging") > -1 ? true : false;
    // send request once counter has been fetched
    getRequestCounter(function(requestCount){
        sendRequest(req, res, requestCount, onStaging);
    });
});

function sendRequest(req, res, requestCount, onStaging){
    console.log("======= requestForm ========");
    requestCount++; // new request, increase counter by 1

    var name = req.body.name;
    var team = req.body.team;
    var deadline = req.body.deadline;
    var summary = req.body.summary;
    var subjectPrefix = onStaging ? "(test on staging) " : "";
    var mailOptions = {
        from: "request@studiomofo.org <request@studiomofo.org>",
        to: "Studio MoFo <studiomofo@mozillafoundation.org>",
        subject: subjectPrefix + "[ Request Form ] #" + requestCount + ", from " + name,
        generateTextFromHTML: true,
        html: "<b>Requester:</b> " + name + "<br /> "
            + "<b>Team: </b>" + team + "<br />"
            + "<b>Deadline: </b>" + deadline + "<br />"
            + "<b>Summary: </b>" + summary
    };

    sesTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.render("error");
        }else{
            console.log("Message sent: " + response.message);
            setRequestCounter(requestCount);
            res.render("thankyou", { theName: name});
        }
    });
}

function setRequestCounter(requestCount){
    fs.writeFile(counterFile, requestCount, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log(requestCount + " has been saved on " + counterFile);
        }
    });
}

function getRequestCounter(callback){
    fs.readFile(counterFile, "utf8", function (err, data) {
      if (err) {
        data = 0;
        console.log(err);
      }
      var requestCount = parseInt(data);
      callback(requestCount);
    });
}

app.listen(process.env.PORT, function() {
    console.log("Listening on " + process.env.PORT);
});
