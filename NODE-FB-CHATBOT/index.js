const token = "2NVoH3tNMOpVKgN2HFYX"
const secret_key = "6c86caa1dc5851f8ac1da44ff1543b5d"

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var fs = require('fs');
var flow = require('./flow.js');

app.authorized_pages = [];
fs.readFile("./pages.json", function(err, f){
	if(err){
		app.authorized_pages = [];
		return;
	}
	if(f.length > 0){
		app.authorized_pages = JSON.parse(f)
	}else{
		app.authorized_pages = [];
	}
});
app.use(bodyParser.json());

app.post('/add-page',function(req,res){
	var page = req.body;
	var hasPage = false;
	var i = 0
	for(var page of app.authorized_pages){
		if(req.body.id==page.id){
			hasPage = true
			app.authorized_pages[i] = page;
		}
		i++;
	}
	if(!hasPage){
		app.authorized_pages.push(page);
	}
	fs.writeFile('./pages.json', JSON.stringify(app.authorized_pages), (err) => {
	  if (err) throw err;
	  console.log('The file pages.json has been saved!');
	  res.sendStatus(200)
	});

	
})
app.post('/postback', function (req, res) {
	console.log(JSON.stringify(req.body))
	if(req.body.entry[0]){
		var entry = req.body.entry[0];
		var page_id = entry["id"]
		if(entry["messaging"]){
			if(entry["messaging"][0]){
				var message = entry["messaging"][0]["message"]["text"];
				var recipient_id = entry["messaging"][0]["sender"]["id"];
				console.log(message)
				console.log(recipient_id)
				console.log(page_id)
				if(!message){
					if(entry["messaging"][0]["message"]["attachments"]){
						var att = entry["messaging"][0]["message"]["attachments"];
						message = "sem intencao"
					}
					
				}
				fetchOrSetCachedData(recipient_id)
				.then(function(cached){
					for(var page of app.authorized_pages){
						if(page.id==page_id){
							var id_obra = undefined;
							console.log(cached[recipient_id]["entidades"])
							if(cached[recipient_id]["entidades"]){
								for(var e of cached[recipient_id]["entidades"]){
									if(e["nome"]=="ID_OBRA"){
										id_obra = e["valor"];
									}
								}
							}
							
							callIA(message,recipient_id,cached[recipient_id]["current_intent"],id_obra)
							.then(function(response){
								var i = response["intent"]["name"]!==undefined ?response["intent"]["name"]:"";
								var iaPayload = {
									"intent":i,
									"entidades":response["entities"].length>0?response["entities"]:undefined,
									"resumo":response["resumo"]
								}
								fetchOrSetCachedData(recipient_id,"entidades",iaPayload["entidades"]).then(function(data){
									var flowAction = flow.process(message,cached[recipient_id]["status"],iaPayload,cached[recipient_id]["current_intent"],data[recipient_id]);
									fetchOrSetCachedData(recipient_id,"status",flowAction["next_status"])
									.then(function(data){
										return fetchOrSetCachedData(recipient_id,"current_intent",flowAction["next_intent"])
									})
									.then(function(data){
										return fetchOrSetCachedData(recipient_id,"entidades",iaPayload["entidades"])
									})
									.then(function(data){
										console.log("Saved State. "+flowAction["message"]+ " id "+recipient_id +" "+page.access_token)
										sendMessage(page.access_token,recipient_id,flowAction["message"],flowAction["id_obra"])
										res.sendStatus(200)
									}).catch(function(err){
										res.sendStatus(200)
										console.error(err)
									})
								}).catch(function(err){
									res.sendStatus(200)
									console.error(err)
								})
								
							}).catch(function(err){
								res.sendStatus(200)
								console.error(err)
							})
							
							
						}
					}
					
				}).catch(function(err){
					res.sendStatus(200)
					console.error(err)
				})
				
			}
		}
	}
})
function fetchOrSetCachedData(id,key,value){
	return new Promise(function(resolve,reject){
		fs.readFile("./state.json", function(err, f){
			if(err){
				reject(err)
			}
			if(f===undefined){
				resolve({}) 
				return;
			}
			var payload = JSON.parse(f)
			if(!payload[id]){
				var a = {}
				a[key] = value;
				payload[id] = a
				data = payload[id]
			}else{
				data=payload[id]
			}
			if(!key){
				resolve(payload)
				return;
			}
			if(value){
				data[key] = value
				payload[id] = data;
				fs.writeFile('./state.json', JSON.stringify(payload), (err) => {
				  if (err) reject(err);
				  console.log("STATE Written.")
				  resolve(payload)
				  return payload;
				});
			}else{
				resolve(payload[id])
			}
		});
		
	})
}
function callIA(msg,id,current_state,id_obra){
	if(!current_state){
		current_state = "SAUDACAO"
	}
	// Set the headers
	var headers = {
	    //'User-Agent':'chuck norris',
	    'Content-Type':'application/json'
	}

	// Configure the request
	var options = {
	    url: "https://3e5c9229.ngrok.io/parser",
	    method: 'POST',
	    headers: headers,
	    form: JSON.stringify({
			"estado_atual":current_state,
			"msg":msg,
			"id_obra":id_obra,
			"id":id,
		})
	}

	return new Promise(function(resolve,reject){
		// Start the request
		request(options, function (error, response, body) {
			//console.log(response)
		    if (!error && response.statusCode == 200) {
		        // Print out the response body
		        resolve(JSON.parse(body))
		        //console.log(body)
		    }else{
		    	reject(error)
		    	console.error(error)
		    }
		})
	})
	
	
}
function sendMessage(page_access_token,recipient_id,message){
	console.log("Sending message.")
	// Set the headers
	var headers = {
	    'User-Agent':'chuck norris',
	    'Content-Type':'application/json'
	}

	// Configure the request
	var options = {
	    url: "https://graph.facebook.com/v2.10/me/messages?access_token="+page_access_token,
	    method: 'POST',
	    headers: headers,
	    form: {
			"recipient":{
				"id":recipient_id
			},
			"message":{
				"text":message
			}
		}
	}

	// Start the request
	request(options, function (error, response, body) {
		//console.log(response)
	    if (!error && response.statusCode == 200) {
	        // Print out the response body
	        console.log(body)
	    }else{
	    	console.error(error)
	    }
	})
	
}
app.get('/postback', function (req, res) {
	var payload = req.query;
	console.log(payload)
	if (payload['hub.mode']) {
        if (payload['hub.verify_token'] == token) {
        	res.send(payload['hub.challenge'])
        }else{
        	res.sendStatus(422);
        }
    }

});
app.use('/public', express.static('public'));

app.listen(8080, function () {
  	console.log("Application is listening on port "+8080);
});


