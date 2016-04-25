/**
 * Created by Administrator on 4/26/14.
 */

var DatabaseConfig = require('../Config/DatabaseConfig');
var Common = require('./Common.js');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db;
var userdoc;
var messagedoc;
var cachedoc;

const DataManager = {

    initialize(){
        MongoClient.connect(DatabaseConfig.getConnectionString(), function(err, database) {
            if(err) throw err;
            db = database;
            userdoc = database.collection("userinfo");
            messagedoc = database.collection("msgstore");
            cachedoc = database.collection("cache");
            console.log('initialize');
            console.log(userdoc);
        });
        if(typeof cachedoc == "undefined")
            console.log("undefined");
        else
            console.log("cachedoc");
    },
    getuserinfo(username, callback){
        var _this = this;
        userdoc.find({username:username})
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        var lastconnect = docs[0].lastconnect;
                        var loginstore = docs[0].loginstore;
                        var result = [];
                        if(typeof lastconnect !== 'undefined'){
                            var timelastconnect = new Date(lastconnect);
                            var drefresh = new Date();
                            drefresh.setMinutes(drefresh.getMinutes() - 20); 
                            var contacts = docs[0].contact;
                            
                            
                            if(timelastconnect > drefresh){
                                //var contacts = docs[0].contact;
                                for(var i = 0; i < contacts.length; i ++){ 
                                    if(typeof contacts[i].contacting !== 'undefined' && typeof  contacts[i].index !== 'undefined' && typeof  contacts[i].view !== 'undefined'){
                                        result.push(contacts[i]);
                                    }
                                }
                                //if(typeof  callback == "function") callback(result,docs[0]);
                            }else{ 
                                try{

                                    var contact1s = docs[0].contact;
                                    for(var i = 0; i < contact1s.length; i ++){
                                        if(typeof contact1s[i].contacting !== 'undefined'){
                                            delete  contact1s[i].contacting;
                                        }
                                        if(typeof contact1s[i].index !== 'undefined'){
                                            delete  contact1s[i].index;
                                        }
                                        if(typeof contact1s[i].view !== 'undefined'){
                                            delete  contact1s[i].view;
                                        }
                                    }
                                     _this.updateobject('userinfo',{_id:docs[0]._id},{$set:{contact:contact1s}});
                                    // _this.updateobjectconn('userinfo',{_id:docs[0]._id},{$set:{contact:contact1s}},db);
                                }catch (errr){console.log(errr+"getuserinfo3")};
                            }
                            
                        }
                        if(typeof  callback == "function") callback(result,docs[0]);
                        if(typeof loginstore !== 'undefined'){
                            try {
                                var firstconn = new Date(loginstore.firstconnect);
                                var store = loginstore.store;
                                var timelastconnect = new Date(lastconnect);
                                var drefresh = new Date();
                                var indexstore = new Common().monthdiff(firstconn, new Date());
                                drefresh.setMinutes(drefresh.getMinutes() - 20); 
                                if (timelastconnect < drefresh) {
                                    
                                    if (store.length < indexstore) {
                                        for (var i = store.length; i < indexstore; i++) {
                                            store.push(0);
                                        }
                                        store.push(1);
                                    } else if (store.length === indexstore) {
                                        store.push(1);
                                    } else {
                                        var v = store[indexstore];
                                        store[indexstore] = (v + 1);
                                    }
                                    
                                    _this.updateobject('userinfo',{username:username},{$set:{loginstore: {firstconnect: firstconn,store: store}}});
                                    // _this.updateobjectconn('userinfo',{username:username},{$set:{loginstore: {firstconnect: firstconn,store: store}}},db);
                                } else {
                                    
                                }
                            }catch (errrr){
                                console.log(errrr+"getuserinfo13");
                            }
                        }else{
                            
                            _this.updateobject('userinfo',{username:username},{$set:{loginstore:{firstconnect: new Date(), store:[1]}}});
                            // _this.updateobjectconn('userinfo',{username:username},{$set:{loginstore:{firstconnect: new Date(), store:[1]}}},db);
                        }
                    }
                    else{
						if(typeof  callback == "function") callback("","nouser");
                        // _this.insertobjectoption('userinfo',{username:username,contact:[],loginstore:{firstconnect: new Date(), store:[1]}},{continueOnError: true});
                        // _this.insertobjectoptionconn('userinfo',{username:username,contact:[],loginstore:{firstconnect: new Date(), store:[1]}},{continueOnError: true},db);
                        
                    }
                }
            });
        
    },
    updateusercontact(usercontact){
        var _this = this;
        userdoc.find({username: usercontact.username})
            .toArray(function (err, docs) {
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        _this.updateobject('userinfo',{username:usercontact.username},{$set:{fullname: usercontact.fullname,avatar:usercontact.avatar,khongdau:usercontact.khongdau}});
                        // _this.updateobjectconn('userinfo',{username:usercontact.username},{$set:{fullname: usercontact.fullname,avatar:usercontact.avatar}},db);
                    }else{
                        _this.insertobjectoption('userinfo',{username:usercontact.username,fullname:usercontact.fullname,khongdau:usercontact.khongdau,avatar:usercontact.avatar,contact:[],loginstore:{firstconnect: new Date(), store:[1]}},{continueOnError: true});
                        // _this.insertobjectoptionconn('userinfo',{username:usercontact.username,fullname:usercontact.fullname,avatar:usercontact.avatar,contact:[],loginstore:{firstconnect: new Date(), store:[1]}},{continueOnError: true},db);
                    }
                }
                
            });
    },
    getmsgoffline(data,ncontact,callback){
        var _this = this;
        if(ncontact.length > 0){
            messagedoc.find({receiver:data,successful:"0",sender:{$nin:ncontact}})
                .toArray(function (err, docs){
                    if(!err){
                        var rc = docs.length;
                        if(rc>0){
                            if(typeof  callback == "function") callback(docs);
                        }
                    }
                });
        }else{
            messagedoc.find({receiver:data,successful:"0"})
                .toArray(function (err, docs){
                    if(!err){
                        var rc = docs.length;
                        if(rc>0){
                            if(typeof  callback == "function") callback(docs);
                        }
                    }
                });
        }
    },
    updatecontact(username, contact,callback){
        var _this = this;

        userdoc.find({username:username})
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    try {
                        if (rc > 0) {
                            var contacts = docs[0].contact;
                            var contactupdate = [];
                            if (Array.isArray && Array.isArray(contact)) {
                                contactupdate = contact;
                            } else {
                                contactupdate.push(contact);
                            }
                            for (var j = 0; j < contactupdate.length; j++) {
                                var exit = false;
                                for (var i = 0; i < contacts.length; i++) {
                                    // console.log(contacts.length);
                                    if (contacts[i].username === contactupdate[j].username) {
                                        contacts[i] = contactupdate[j];
                                        exit = true;
                                    }
                                }
                                if (!exit)
                                    contacts.push(contactupdate[j]);
                            }
                            _this.updatecontact2(docs[0]._id, contacts); 
                        }
                    }catch(errr){
                        console.log("updatecontact2"+ errr);
                    }
                }
                
            }); 
    },
    updatecontact2(id, contacts){
        var _this = this;

        userdoc.update({_id: id}, {$set:{contact: contacts}},function(err){
            if (err) {
                console.log("updatecontact22");
            }
        });
    },
    removecontact(username, contact){
        var _this = this;

        userdoc.find({username:username})
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    try {
                        if (rc > 0) {
                            var contacts = docs[0].contact;
                            var index = -1;
                            for (var j = 0; j < contacts.length; j++) {

                                if (contacts[j].username === contact.username)
                                    index = j;
                            }
                                if (index !== -1)
                                    contacts.splice(index,1);

                            _this.updatecontact2(docs[0]._id, contacts); 
                        }
                    }catch(errr){
                        console.log("removecontact"+ errr);
                    }
                }
            });
    },
    updatefieldcontact(username,usercontact,field,value){
		var _this = this;
        var contactupdate = {};
        try {
            if (field === "timeclean") {
                contactupdate["contact.$.timeclean"] = new Date();
            } else {
                contactupdate["contact.$." + field] = value;
            }
            if (value === "" || value === null) {
                _this.updateobject("userinfo",{username: username, "contact.username": usercontact},{$unset: contactupdate});
                // _this.updateobjectconn("userinfo",{username: username, "contact.username": usercontact},{$unset: contactupdate},db);
            } else {
                _this.updateobject("userinfo",{username: username, "contact.username": usercontact},{$set: contactupdate});
                // _this.updateobjectconn("userinfo",{username: username, "contact.username": usercontact},{$set: contactupdate},db);
            }
        }catch (errr){
            console.log("updatefieldcontact2"+errr);
        }
    },
    updatefieldscontact(username,usercontact,fields,unset){
		var _this = this;
		
        try {
            if (unset) {
                _this.updateobject("userinfo",{username: username, "contact.username": usercontact},{$unset: fields});
                // _this.updateobjectconn("userinfo",{username: username, "contact.username": usercontact},{$unset: fields},db);
            } else {
                _this.updateobject("userinfo",{username: username, "contact.username": usercontact},{$set: fields});
                // _this.updateobjectconn("userinfo",{username: username, "contact.username": usercontact},{$set: fields},db);
            }
        }catch(errr){
            console.log("dauptefielsdcontact23"+ errr);
        }
    },
    addmessage(message, callback){
		var _this = this;
        messagedoc.insert(message, {continueOnError: true}, function(err, docs) {
			//console.log(docs);
            if(typeof  callback == "function") callback(docs.ops[0]);
        });
    },
    getlastmsg(user1, user2, numbermsg, callback){
		var _this = this;

        if(numbermsg === null){
            numbermsg = 10;
        }
        userdoc.find({username: user1, "contact.username": user2}, {'contact.$': 1})
            .toArray(function (err, docs) {
                var isclose = false;
                if (!err) {
                    var rc = docs.length;
                    if (rc > 0) {
                        var contacttimeclean = docs[0].contact;
                        if (typeof contacttimeclean[0].timeclean === 'undefined') {
                            _this.findobjectsortlimitcallback('msgstore',{ $or:[{receiver:user1,sender:user2},{receiver:user2,sender:user1}]},{time:-1},numbermsg,callback);
                            // _this.findobjectsortlimitcallbackconn('msgstore',{ $or:[{receiver:user1,sender:user2},{receiver:user2,sender:user1}]},{time:-1},numbermsg,callback,db);
                        }else{
                            _this.findobjectsortlimitcallback('msgstore',{ $or:[{receiver:user1,sender:user2},{receiver:user2,sender:user1}],time:{$gt:new Date(contacttimeclean[0].timeclean)}},{time:-1},numbermsg,callback);
                            // _this.findobjectsortlimitcallbackconn('msgstore',{ $or:[{receiver:user1,sender:user2},{receiver:user2,sender:user1}],time:{$gt:new Date(contacttimeclean[0].timeclean)}},{time:-1},numbermsg,callback,db);
                        }
                    }
                }
                
            });
    },//*
    updatemessage(data){
        var _this = this;
        messagedoc.update({_id:ObjectID(data)},{$set:{successful:"1"}},function(err){
            if (err) {
                console.log("updatemessage1");
            }
        });
    },
    updatemessages(data){
        var _this = this;
		//console.log(data);
        messagedoc.update({sender:data.sender,receiver:data.receiver},{$set:{successful:"1"}},{ multi: true },function(err){
            if (err) {
                console.log("updatemessages1");
            }
            
        });
    },
    getmessagehitory(data, callback){
        var _this = this;

        userdoc.find({username:data.sender,"contact.username":data.receiver},{'contact.$':1})
            .toArray(function (err, docs){
                var isclose = false;
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        var contacttimeclean = docs[0].contact;
                        if (typeof contacttimeclean[0].timeclean === 'undefined') {
                            _this.findobjectsortlimitcallback('msgstore',{ $or:[{receiver:data.receiver,sender:data.sender},{receiver:data.sender,sender:data.receiver}],time:{$lt:new Date(data.time)}},{time:-1},10,callback);
                            // _this.findobjectsortlimitcallbackconn('msgstore',{ $or:[{receiver:data.receiver,sender:data.sender},{receiver:data.sender,sender:data.receiver}],time:{$lt:new Date(data.time)}},{time:-1},10,callback,db);
                        }else{
                            _this.findobjectsortlimitcallback("msgstore",{ $or:[{receiver:data.receiver,sender:data.sender},{receiver:data.sender,sender:data.receiver}],time:{$lt:new Date(data.time),$gt:new Date(contacttimeclean[0].timeclean)}},{time:-1},10,callback);
                            // _this.findobjectsortlimitcallbackconn("msgstore",{ $or:[{receiver:data.receiver,sender:data.sender},{receiver:data.sender,sender:data.receiver}],time:{$lt:new Date(data.time),$gt:new Date(contacttimeclean[0].timeclean)}},{time:-1},10,callback,db);
                        }
                    }
                }else
                    console.log("getmessagehitory3");
            });
    },
    getmsgbyid(idmsg,callback){
        var _this = this;
        messagedoc.find({ _id:ObjectID(idmsg)})
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        callback(docs[0]);
                    }
                }
                
            });
    },
    setlastconnect(data){
        var _this = this;
        var d = new Date();
        _this.updateobject("userinfo",{ username:data},{$set:{lastconnect:d}});

        
        var contactupdate = {};
        contactupdate["contact.$.lastconnect"] = d;
        var contactquery = {};
        contactquery["contact.username"] = data;

        _this.updateobjectoption("userinfo",contactquery,{$set:contactupdate},{multi:true});
    },
	updateavatar(user,avatar){
		this.updateobject("userinfo",{username:user},{$set:{avatar:avatar}});
		var contactupdate = {};
        contactupdate["contact.$.avatar"] = avatar;
        var contactquery = {};
        contactquery["contact.username"] = user;
		//console.log(a);
		this.updateobjectoption("userinfo",contactquery,{$set:contactupdate},{multi:true});
	},
    addusertocache(data){
		var _this = this;
		_this.updateobject("cache",{cacheid:1},{$addToSet:{useronline:data}});
	},
	setuseronline(data,online){ // set online offline user in all contacted.
        var _this = this;

        var contactquery = {};
        contactquery["contact.username"] = data;
    
        if(!online){  // set user offline.
            var d = new Date();
            _this.updateobjectoption("userinfo",{username:data},{$set:{lastconnect:d}},{multi:true});
            _this.updateobjectoption("userinfo",contactquery,{$unset:{"contact.$.online":""},$set:{"contact.$.lastconnect":d}},{multi:true});
            // _this.updateobjectoptionconn("userinfo",{username:data},{$set:{lastconnect:d}},{multi:true},db);
            // _this.updateobjectoptionconn("userinfo",contactquery,{$unset:{"contact.$.online":""},$set:{"contact.$.lastconnect":d}},{multi:true},db);
            _this.updateobject("cache",{cacheid:1},{$pull:{useronline:data}});
        }else{ // set user online.
            _this.updateobjectoption("userinfo",contactquery,{$set:{"contact.$.online":true}},{multi:true});
            // _this.updateobjectoptionconn("userinfo",contactquery,{$set:{"contact.$.online":true}},{multi:true},db);
            _this.updateobject("cache",{cacheid:1},{$addToSet:{useronline:data}});
        }
    },
	setuseroffline(data){
		var _this = this;
		_this.setuseronline(data,false);
	},
	setforreset(){ // set all user to offline.
		var _this = this;

        cachedoc.find({cacheid:1}).toArray(function(err,docs){
            if(!err){
                if(docs[0].useronline){
                    for(var i = 0; i <docs[0].useronline.length;i++)
                        _this.setuseronline(docs[0].useronline[i],false);
                }
                _this.updateobject('cache',{cacheid:1},{$set:{"useronline":[]}});
                // _this.updateobjectconn('cache',{cacheid:1},{$set:{"useronline":[]}},db);
            }
        });

	},
    getloginstore(data, callback){ 
		var _this = this;


        var month = data.month;
        var year = data.year;
        var datareturn = 0;
        var cm = new Common();
        userdoc.find({username:data.username})
            .toArray(function (err, docs) {
                if (!err) {
                    var rc = docs.length;
                    if(rc > 0){
                        var loginstore = docs[0].loginstore;
                        var firstconn = new Date(loginstore.firstconnect);
                        var store = loginstore.store;
                        if(year === "all" || year === '' || year === 'undefined'){
                            for(var j = 0; j < store.length; j ++)
                                datareturn += store[j];
                        }else{
                            if(month === "all" || month === '' || month === 'undefined'){
                                if(firstconn.getFullYear <= year){
                                    var index = cm.monthdiff(firstconn,new Date(year,12,1));
                                    for(var j = index; j > 0; j --){
                                        var k = 0;
                                        if(k < 12 && typeof store[j] !== 'undefined')
                                            datareturn += store[j];
                                        k++;
                                    }
                                }
                            }else{
                                var index = cm.monthdiff(firstconn, new Date(year,month,1));
                                if(typeof store[index] !== 'undefined')
                                    datareturn = store[index];
                            }
                        }
                    }
                    
                }
            });
        if(typeof callback === 'function'){
            callback(datareturn);
        }
    },
    getloginstores(data, callback){ 
        var _this = this;

        var month = data.month;
        if(typeof data.month === 'undefined')
            month = "all";
        var year = data.year;
        if(typeof data.year=== 'undefined')
            year = 'all';
        var datareturn  = [];
        var cm = new Common();
        userdoc.find({username:{$in:data.users}})
            .toArray(function (err, docs) {
                if (!err) {
                    var rc = docs.length;
                    if(rc > 0){
                        try {
                            for (var i = 0; i < docs.length; i++) {
                                var userstore = {username: docs[i].username, login: 0};
                                var loginstore = docs[i].loginstore;
                                var firstconn = new Date(loginstore.firstconnect);
                                var store = loginstore.store;
                                if (year === "all" || year === '' || year === 'undefined') {
                                    for (var j = 0; j < store.length; j++)
                                        userstore.login += store[j];
                                } else {
                                    if (month === "all"  || month === '' || month === 'undefined') {
                                        if (firstconn.getFullYear() <= year) {
                                            var index = cm.monthdiff(firstconn, new Date(year, 11, 1));
                                            for (var j = index; j > 0; j--) {
                                                console.log(j+'-----');
                                                var k = 0;
                                                if (k < 12 && typeof store[j] !== 'undefined')
                                                    userstore.login += store[j];
                                                k++;
                                            }
                                        }else{
                                            console.log(firstconn.getFullYear +"-"+ year);
                                        }
                                    } else {
                                        var index = cm.monthdiff(firstconn, new Date(year, month-1, 1));
                                        
                                        if (typeof store[index] !== 'undefined')
                                            userstore.login = store[index];
                                    }
                                }
                                datareturn.push(userstore);
                            }
                        }catch (eere){console.log("getloginstores2"+ eere);}
                    }
                    if(typeof callback === 'function')
                        callback(datareturn);
                    
                }
            });
    },
    
    // workshop database util
    // <-- collection name -->: broadcaster
    // <-- document struct -->:{docid:1,workshop:'apectel45',hoatdong:1,ten:'thông báo',noidung:'thông báo họp',batdau:ISODate("2014-12-27T16:56:03.164Z"),ketthuc:ISODate("2014-12-27T16:56:03.164Z"),biendo:(+)5,baolai:10,donvibaolai:"M/W/d/h/m",baotruoc:10,donvibaotruoc:'M/W/d/h/m',trangthai:0/1}

    // end workshop database util

    // database core
    createcollection(colname){},
    createcollectionoption(colname,option){},

    updateobject(col,query,update){
        var _this = this;
        var collection = db.collection(col);
        collection.update(query, update,function(err){
            if (err) {
                console.log("updateobjectconn  error" + col+"    "+err+"                                      ");
            }
        });
    },
    updateobjectoption(col,query,update,option){
        var _this = this;
        var collection = db.collection(col);
        collection.update(query, update,option,function(err){
            if (err) {
                console.log("updateobjectoptionconn  error" + col+"    "+err+"");
            }
        });
    },
    updateobjectcallback(col,query,update,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.update(query, update,function(err){
            if (err) {
                console.log("updateobjectcallbackconn  error" + col+"    "+err+"                                      ");
            }
            if(typeof callback === 'function'){
                callback();
            }
        });
    }, 
    updateobjectoptioncallback(col,query,update,option,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.update(query, update,option,function(err){
            if (err) {
                console.log("updateobjectoptioncallback  error" + col+"    "+err+"                                      ");
            }
            if(typeof callback === 'function'){
                callback();
            }
        });
    },
    insertobject(col,object){
        var _this = this;
        var collection = db.collection(col);
        collection.insert(object, function(err, docs) {
            if (err) {
                console.log("insertobject  error" + col+"    "+err+"                                      ");
            }
        });
    },
    insertobjectoption(col,object,option){
        var _this = this;
        var collection = db.collection(col);
        collection.insert(object,option, function(err, docs) {
            if (err) {
                console.log("insertobjectoption  error" + col+"    "+err+"                                      ");
            }
        });
    },
    insertobjectcallback(col,object,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.insert(object, function(err, docs) {
            if (!err) {
                var rc = docs.length;
                if(rc>0){
                    if(typeof callback === 'function')
                        callback(docs.ops[0]);
                }

            }else{
                console.log("insertobjectcallback  error" + col+"    "+err+"                                      ");
            }
        });
    },
    insertobjectoptioncallback(col,object,option,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.insert(object,option, function(err, docs) {
            if (!err) {
                var rc = docs.length;
                if(rc>0){
                    if(typeof callback === 'function')
                        callback(docs.ops[0]);
                }

            }else{
                console.log("insertobjectoptioncallback  error" + col+"    "+err+"                                      ");
            }
        });
    },
    removeobject(col,query){
        var _this = this;
        var collection = db.collection(col);
        collection.remove(query,function(err){
            if (err) {
                console.log("removeobject  error" + col+"    "+err+"                                      ");
            }
        });
    },
    removeobjectoption(col,query,option){
        var _this = this;
        var collection = db.collection(col);
        collection.remove(query,option,function(err){
            if (err) {
                console.log("removeobjectoptionconn  error" + col+"    "+err+"                                      ");
            }
        });
    },
    removeobjectcallback(col,query,callback){
        var _this = this;
        var collection = db.collection(col);
        var result = collection.remove(query,function(err){
            if (err) {
                console.log("removeobjectcallback  error" + col+"    "+err+"                                      ");
            }
        });
        if(typeof callback === 'function')
            callback(result);
    },
    removeobjectoptioncallback(col,query,option,callback){
        var _this = this;
        var collection = db.collection(col);
        var result = collection.remove(query,option,function(err){
            if (err) {
                console.log("removeobjectoptioncallback  error" + col+"    "+err+"                                      ");
            }
            
        });
        if(typeof callback === 'function')
            callback(result);
    },
    findobjectcallback(col,query,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.find(query)
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        if(typeof  callback == "function") callback(docs);
                    }
                }else{
                    console.log("findobjectcallbackconn  error" + col+"    "+err+"                                      ");
                }
                
            });
    },
    findobjectoptioncallback(col,query,option,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.find(query,option)
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        if(typeof  callback == "function") callback(docs);
                    }
                }else{
                    console.log("findobjectoptioncallbackconn error" + col+"    "+err+"                                      ");
                }
                
            });
    },
    findobjectlimitcallback(col,query,select,limit,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.find(query,select).limit(limit)
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        if(typeof  callback == "function") callback(docs);
                    }
                    //console.log(query);
                }else{
                    console.log("findobjectlimitcallbackconn  error" + col+"    "+err+"                                      ");
                }
            });
    },
    findobjectsortlimitcallback(col,query,sort,limit,callback){
        var _this = this;
        var collection = db.collection(col);
        collection.find(query).sort(sort).limit(limit)
            .toArray(function (err, docs){
                if(!err){
                    var rc = docs.length;
                    if(rc>0){
                        if(typeof  callback == "function"){ 
                            callback(docs);
                        }
                    }
                    //console.log(docs);
                }else{
                    console.log("findobjectsortlimitcallbackconn  error" + col+"    "+err+"                                      ");
                }
            });
    }

    // end database core
	
};

module.exports = DataManager;