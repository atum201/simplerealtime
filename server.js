var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , _ = require('underscore')
  , DatabaseConfig = require('./library/Config/DatabaseConfig')
  , MongoClient = require('mongodb').MongoClient
  , DataManager = require('./library/Common/DataManager');
var ObjectID=require('mongodb').ObjectID;
//console.log(db);
//DataManager.initialize();
// var broadcast = 'broadcaster';
app.listen(8181);
DataManager.initialize();
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

//reset database
//DataManager.setforreset();
var fisrtconnect = false;
var fs = require('fs');

var usersockets = {};
var sockers = {}; 

var usersocketsnot = {}; 
var sockersnot = {}; 

var usersocketsmic = {}; 
var sockersmic = {}; 

io.sockets.on('connection',function(socket){
    socket.on("client connect", function(data,avatar){ 
        try{
            usersockets[socket.id] = data;
            sockers[socket.id] = socket;
            // DataManager.addusertocache(data);
            DataManager.setuseronline(data,true);
            if(data == "6397" && !fisrtconnect){
				DataManager.setforreset();
				fisrtconnect = true;
			}
				
            var listuseronline =  _.union(_.values(usersockets));
            
            socket.broadcast.emit("user new connect", data,listuseronline.length);
            DataManager.getuserinfo(data,function(contactlog,result){
				if(!result)
				console.log("khong co ket qua"+data);
				if(result == "nouser"){
					socket.emit("add user info");
					console.log('add new info');
				}
					
				else
					socket.emit("get userinfo",contactlog,result,listuseronline.length, new Date());
				
            });
			//DataManager.updateobject('userinfo',{username:data},{$set:{avatar:avatar}});
			
			DataManager.updateavatar(data,avatar);
        }catch (err){
            console.log("adsadadsdsadasd"+err);
        }
    });	
	socket.on("fetch user info",function(data){
		try{
			//console.log("fetch user info");
            DataManager.setuseronline(data,true);

            var listuseronline =  _.union(_.values(usersockets));
            
            DataManager.getuserinfo(data,function(contactlog,result){
				if(!result)
				console.log("khong co ket qua"+data);
                socket.emit("get userinfo",contactlog,result,listuseronline.length, new Date());
				//console.log(result);
            });
			//console.log('user online:'+listuseronline+" :socket connect"+ _.values(usersockets));
        }catch (err){
            console.log("dsdsad"+err);
        }
	});
	
	socket.on("check user online",function(data){
		var index = _.indexOf(_.values(usersockets),data);
		DataManager.findobjectoptioncallback('userinfo',{username:data},{username:1,avatar:1,fullname:1},function(result){
			result[0].online = (index != -1) ? true: false;
			//console.log(result);
			socket.emit("user info contact",result);
		});
	});
	
	socket.on("update all contact server",function(data){
        try {
			//console.log(data.length);
            for (var i = 0; i < data.length; i++) {
                DataManager.updateusercontact(data[i]);
            }
        }catch (err){console.log(err+"update all contact server erroe")}
    });

	socket.on("add new user info",function(data){
		DataManager.insertobjectoption('userinfo',{username:data.username,contact:[],khongdau:data.khongdau,fullname:data.fullname,avatar:data.avatar,loginstore:{firstconnect: new Date(), }},{continueOnError: true});
		socket.emit("add new user finish");
		console.log("add new user finish");
	});
	
    socket.on("search name key", function(keysearch){
        try{
			//console.log(keysearch);
			var limit = keysearch.length * 10;
            DataManager.findobjectlimitcallback('userinfo',{khongdau:new RegExp('.*' + keysearch)},{username:1,fullname:1,avatar:1},limit,function(result){
                //console.log(result);
				socket.emit("receive contact-search",result);
            })
        }catch(err){
            console.log(err+" search name key error");
        }
    });
	
    socket.on("danhba user online",function(){
        var useronlinearray = [];
        for (var key in usersockets) {
            useronlinearray.push(usersockets[key]);
        }
        if(useronlinearray.length > 0){
            socket.emit("get danhba online", useronlinearray);
        }
    });

    socket.on("get message offline", function(data,ncontact){ 
        DataManager.getmsgoffline(data,ncontact,function(result){
            socket.emit("return message offline",result);
        });
    })

    socket.on("update contact",function(username,contact){
        DataManager.updatecontact(username,contact,function(result){
        });
    });

    socket.on("remove contact",function(username,contact){
        DataManager.removecontact(username,contact);
    });

    socket.on("update field contact", function(username,usercontact,field,value){ 
		//console.log("update fields contact"+username);
        DataManager.updatefieldcontact(username,usercontact,field,value);
    });

    socket.on("update fields contact",function (username, usercontact, fields,unset){
		//console.log("update fields contact"+username);
        DataManager.updatefieldscontact(username, usercontact,fields,unset);
    });

    socket.on("get last message", function(data){
        DataManager.getlastmsg(data.sender,data.receiver,10,function(result){ 
            socket.emit("return last message",result);
        });
    });

    socket.on('private msg',function(data){ 
        var recerver = data.receiver;
        data.successful = "0";
        data.time= new Date();

        DataManager.addmessage(data, function(result){
            for (var key in usersockets){
                if(usersockets[key] == recerver){
                    sockers[key].emit("receiver new message", result);
                }
            }
            socket.emit("send successful", result); 
        });
    });

    socket.on("view message",function(data){ 
        DataManager.updatemessage(data);
    });

    socket.on("view all message",function(data){ 
        DataManager.updatemessages(data);
    });
	
	socket.on("file attach send success",function(data){
		DataManager.updateobject("msgstore",{_id:ObjectID(data.idmsg)},{$set:{contentmessage:data.contentmsg}});
		socket.emit("file attach received success",{idfileclient:data.idfile,linkfile:data.linkfile});
	});
	
    socket.on("get message history",function(data){ 
        DataManager.getmessagehitory(data,function(result){ 
            socket.emit("return message history", result);
        });
    });

    socket.on("get login store", function(data){
        DataManager.getloginstore(data,function(result){
            socket.emit("return login store",result);
        });
    });

    socket.on("get many login store", function(data){
        console.log(data.month + "_____" + data.year);
        DataManager.getloginstores(data, function(result){
            console.log(result);
            socket.emit("return many login store", result);
        }) ;
    });

    socket.on("notification connect", function(data){ 
        try{
            usersocketsnot[socket.id] = data;
            sockersnot[socket.id] = socket;
            console.log(data);
        }catch (err){
            console.log(err);
        }
    });

    socket.on("notification v1",function(receiver, data){
        console.log('notification v1');
        try {
            for (var key in usersocketsnot) {
                if (usersocketsnot[key] == receiver) {
                    sockersnot[key].emit("receive notification", data);
                    socket.emit("notification successfull", 'finish');
                    console.log(data);
                }
            }
        }catch(err) {
            console.log(err);
        }
    });

    socket.on("notification v2",function(data){
        try {
            console.log('v2');
            socket.emit("receive notification", data);
            console.log(data);
        }catch(err) {
            console.log(err);
        }
    });

    socket.on("notification v3",function(receiver, data){
        try {
            console.log('v3');
            for (var u in receiver) {
                for (var key in usersocketsnot) {
                    if (usersocketsnot[key] == receiver[u]) {
                        sockersnot[key].emit("receive notification", data);
                        console.log('receive v3' + key +"||" + usersocketsnot[key]);
                    }
                }
            }
        }catch(err) {
            console.log(err);
        }
    });

    socket.on("mic connect", function(data){ 
        try{
            usersocketsmic[socket.id] = data;
            sockersmic[socket.id] = socket;
        }catch (err){
            console.log(err);
        }
    });

    socket.on("notification mic",function(receiver, data){
        try {
            for (var u in receiver) {
                for (var key in usersockets) {
                    if (usersockets[key] === receiver[u]) {
                        sockers[key].emit("receive notification", data);
                    }
                }
            }
        }catch(err) {
            console.log(err);
        }
    });

    socket.on('disconnect', function() { 
        try {

            if (typeof usersockets[socket.id] === 'undefined' || usersockets[socket.id] === null) {
                if(usersocketsnot[socket.id] !== 'undefined') {
                    delete usersocketsnot[socket.id];
                    delete sockersnot[socket.id];
                }
                if(usersocketsmic[socket.id] !== 'undefined') {
                    delete usersocketsmic[socket.id];
                    delete sockersmic[socket.id];
                }
            }else {
                var disconnect = true;
                for (var key in usersockets) {
                    if (usersockets[key] == usersockets[socket.id] && key !== socket.id) {
                        disconnect = false;
                    }
                }
                if (disconnect) {
                    DataManager.setuseronline(usersockets[socket.id], false);
					
					var listuseronline =  _.union(_.values(usersockets));
					
                    socket.broadcast.emit("user disconnect", usersockets[socket.id],listuseronline.length);
                }
                if(usersockets[socket.id] !== 'undefined') {
                    delete usersockets[socket.id];
                    delete sockers[socket.id];
                }
                if(usersocketsnot[socket.id] !== 'undefined') {
                    delete usersocketsnot[socket.id];
                    delete sockersnot[socket.id];
                }
                if(usersocketsmic[socket.id] !== 'undefined') {
                    delete usersocketsmic[socket.id];
                    delete sockersmic[socket.id];
                }
            }
        }catch (err){
            console.log(err);
        }
    });
});

