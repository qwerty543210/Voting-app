/*  Config variable  */
var config = {
    apiDomain: 'https://api.loginradius.com',
    apiKey: '61440426-0d89-42b2-88fe-a0375531855f',
    apiSecret: '98132e72-41ee-4fc4-ae11-d21fae1f20eb',
    siteName: 'voting-app',
    apiRequestSigning: false,
  };
  
  // Module dependencies.
  var express = require('express');
  var lrObj = require('loginradius-sdk')(config);
  var bodyParser = require('body-parser');
  var path = require('path');
  var session = require('express-session');
  var mysql = require('mysql');
const fs = require('fs');
const async = require('async');
  var app = express();
  var PORT = 3000;
  app.use('/', express.static(path.join(__dirname, '/')));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

    const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
    password : 'root',
    database : 'Integratedata'
});

app.get('/', function(request,response){
    response.sendFile(path.join(__dirname + 'index.html'))
    
})

app.get('/vote', function(request,response){
    response.sendFile(path.join(__dirname + '/vote.html'))

    const accessToken = request.query.token
    request.session.token= accessToken
    let fields =null

    lrObj.authenticationApi.getProfileByAccessToken(accessToken, fields).then((response) => {
        const uniqueId = response.Uid
        const dataset = [uniqueId, null]

        connection.query('SELECT * from records WHERE Uid =?', uniqueId, function(error, results){
            if (error) throw error
            if (results.length>0){
                    console.log('user alrready exist in database')
                }
            else{
                    connection.query('INSERT INTO records (Uid, voted) VALUES (?)', [dataset], function(error, results) {
                        if (error) throw error;
                        console.log('mysql working')
                    });
                }
        });
    }).catch((error) => {
            console.log(error);
        });
})

app.post('/vote', function(request,response){
    const value = request.body.vote;
    const accessToken = request.session.token
    function returnId(callback){
        let fields=null
        lrObj.authenticationApi.getProfileByAccessToken(accessToken, fields).then((response) => {
            const uniqueId = response.Uid
            const dataset = [uniqueId, null]
            return callback(uniqueId)
            }).catch((error) => {
                console.log(error);
        });
    }
    returnId(function(result){
        connection.query('SELECT voted FROM records WHERE Uid=?',result, function(error, results){
        if(results[0].voted!== null){
            request.session.string = 'you have already voted!'
            response.redirect('/done')
        }
        else{
            connection.query('UPDATE votedata SET numberVotes=numberVotes+1 WHERE id=?', value, function(error, results){
                if (error) throw error;
                connection.query("UPDATE records SET voted= ? WHERE Uid=?",[true, result], function(error, results){
                    request.session.string = 'Your vote has been registered!'
                    response.redirect('/done')
              
                })
            })
        }
    })
    })
})
app.get('/done', function(request, response){
    console.log(request.session.string)
    fs.readFile(__dirname + '/response.html', 'utf-8', function(error, data){
        if (error) throw error
        let resultData = data.replace('{templateData}', request.session.string)
        response.write(resultData)
        response.end()
    })
})

app.get('/register', function(request, response){
    response.sendFile(path.join(__dirname + '/registerResponse.html'))
})
app.get('/results', function(request, response){

    fs.readFile(__dirname + '/results.html','utf-8', function(error, data){
        if(error) throw error
        
        function returnData(callback){
            connection.query('SELECT numberVotes FROM votedata', function (error, results){
                let chartData = [];
                for(let i=0; i<5; i++)
                {
                    chartData.push(results[i].numberVotes)
                }
                return callback(chartData)

            })
        }
        let chartData =  [];
        returnData( function(result){
            chartData=result;
            let resultData = data.replace('{chartData}', JSON.stringify(chartData))
            response.write(resultData)
            response.end()
        
        })
    })
});

app.post('/results', function(request,response){
    
        connection.query('UPDATE votedata SET numberVotes=0', function(error,results){
            if (error) throw error;
            connection.query('UPDATE records SET voted = null', function(error,results){
                if (error) throw error;
                response.redirect('/results')
            })
        })
})

app.get('/admin', function( request, response){
    response.sendfile(path.join(__dirname + '/adminLogin.html'))
})

app.post('/admin', function(request, response){
    const username = request.body.username;
	const password = request.body.password;
	if (username && password) {
        if(username==='admin' && password=='admin'){
            response.redirect('/results')
        }
        else{
            response.send("Invalid username and password")
        }
    }
    else{
        response.send("Please enter username and password")
    }

})
  app.listen(PORT, () => console.log('Demo app can be accessed at localhost:' + PORT ));