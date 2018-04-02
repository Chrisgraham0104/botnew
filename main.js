//Initialising node modules
var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var sql1 = require("mssql");
var fs = require('fs'),
xml2js = require('xml2js');
var app = express(); 
var dbConfig = {};
var jsonXML;
// Body Parser Middleware
app.use(bodyParser.json()); 

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

//Setting up server
var server = app.listen(8083, function() {
	//start read xml file
	
	var filepath = '\\xls\\LN.xml';
	var parser = new xml2js.Parser();
	fs.readFile(filepath, function(err, data) {
		parser.parseString(data, function (err, result) {
			console.log(result);			
			console.log('Done');
			jsonXML = result;
			//console.log(jsonXML.Connection.Poland[0].LN35[0].Host);
		});
	});
	//end read xml	
	
    console.log('Server is running3..');
});

//Initiallising connection string
/*var dbConfig = {
domain: 'MASTEK',
    user:  'Chrisg102570',
    password: 'M8$tek#123',
    server: 'IND-MHPDW100512',
    database: 'CDPCRSDEV'
};*/

function configData(filepath, field, fvalue, callback){
	var file=require('xlsjs').readFile(filepath);
	//console.log('file ---->' + file.Sheets.Sheet1);		
	
	var XLSX = require('xlsx')
	var workbook = XLSX.readFile(filepath);
	var sheet_name_list = workbook.SheetNames;
	//var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
	//console.log(xlData);
	sheet_name_list.forEach(function(y) {
		var worksheet = workbook.Sheets[y];
		var headers = {};
		var data = [];
		var xlsData = {} ;
		
		for(z in worksheet) {
			if(z[0] === '!') continue;
			//parse out the column, row, and value
			var col = z.substring(0,1);
			var row = parseInt(z.substring(1));
			var value = worksheet[z].v;
			
			//console.log ( col + ' ' + row + ' ' + value);
			//store header names
			if(row == 1) {
				headers[col] = value;
				continue;
			}

			if(!data[row]) data[row]={};
			data[row][headers[col]] = value;
		}
		//drop those first two rows which are empty
		data.shift();
		data.shift();
		console.log(data);
		
		xlsData = data.find(		
			(id) => {
			console.log (field + ' ' + fvalue);
			 if(field == 'Type'){
				return id.Type === fvalue;
			 }
			 if(field == 'Branch') {
				return id.BranchID.toLowerCase() === fvalue.toLowerCase();
			 }
		   }
		);
		//console.log('xls ---->' + xlsData);		
		console.log(xlsData);
		
		return callback(xlsData);
		/*dbConfig ['user'] = xlsData.Username;
		dbConfig ['password']= xlsData.Password;
		dbConfig ['server'] = xlsData.Host;
		dbConfig ['database']= xlsData.Database;*/
		
	});
}

/*function getDbId(query){
	console.log('getId');
	console.log(dbConfig);
	var id;
	
	 sql1.connect(dbConfig, function (err) {
	    if (err) {   
			 console.log("Error while connecting database :- " + err);
			 res.send(err);
		}else {
			console.log('else');
			var request = new sql1.Request();
			request.query(query, function (rerr, resp) {
				if(rerr){
					 console.log("Error while connecting database :- " + rerr);
					 return 0;
				}else{
					console.log('resp : ' + resp.recordset[0].Agency_Segment_Db_Id);
					id = resp.recordset[0].Agency_Segment_Db_Id;
				}
			});
		}
		sql1.close();
	 });
	 
	 console.log('id-> ' + id);
	 return id;
	
}
*/

//Function to connect to database and execute query
var  executeQuery = function(res, query, rt={}){      
		console.log('connection ------> ' + JSON.stringify(dbConfig));
     sql.connect(dbConfig, function (err) {
         if (err) {   
                     console.log("Error while connecting database :- " + err);
					 res.status(404).send({'error':'undefined database or server'});
                     //res.send(JSON.stringify(err));
                  }
                  else {
                         // create Request object
                         var request = new sql.Request();
                         // query to the database
						 console.log('Request set');
                         request.query(query, function (err, resp) {
                           if (err) {
                                      console.log("Error while querying database :- " + err);
                                      res.send(JSON.stringify(err));
                                     }
                                     else {
                                       console.log('rt' + JSON.stringify(rt));  									 									  										
										sql.close();	
										if(rt.length>0){
											resp['recordset'].push(rt);
											
										}
										console.log('resp' + JSON.stringify(resp));  									 									  										
										res.send(resp);										
									   
                                      }				
							
                               });
                       }
      });           
}

//GET API
app.get('/', function(req , res){
                var query = "select * from dbo.country";
                executeQuery (res, query);
});

app.get('/:pseudo', function(req , res){
                var query = "select * from dbo.country where countrypseudo='" + req.params.pseudo + "'";
                executeQuery (res, query);
});

app.get('/query/:ccId', function(req , res){
	var branch = req.params.ccId;
	console.log('Branch : ' + branch);
	var custId = branch.substr(branch.indexOf('-')+1);
	var country = branch.substr(0,branch.indexOf('-'));
	console.log('CustomerId : ' + custId + ' country:' + country);
    var filepath = '\\xls\\configData.xlsx';
	var fvalue = 'connection';
	var field = 'Type';
	var branchNew = country
	configData(filepath, field, fvalue, function(data) {
			//console.log('Data : ' + data); 
			var tmpPath = 'd:\\bot1\\';   // '.\\'
			var connpath = tmpPath  + data.Folder + '\\'+ data.Filename;
			//console.log(connpath);
			var fvalue = branchNew;
			var field = 'Branch';
			//console.log ('config -->' + field + ' ' + fvalue );
			configData(connpath, field, fvalue, function(connData) {
				console.log('Conn Data : ' + connData);
					dbConfig ['domain'] =  'MASTEK';
					dbConfig ['user'] = connData.Username;
					dbConfig ['password']= connData.Password;
					dbConfig ['server'] = connData.Host;
					dbConfig ['database']= connData.Database;
			});
			
	});	
	
	var query = 'Select * from dbo.customer where Customer_Id =' + custId ;
	console.log(query);
	console.log(dbConfig);
	executeQuery (res, query);
	
});

app.get('/query/:branch/:qstr', function (req, res) {			
		var branch = req.params.branch;
		console.log('Branch : ' + branch);		
		var dbId = branch.substr(branch.indexOf('-')+1);
		var country = capitalize(branch.substr(0,branch.indexOf('-')));
		console.log('Db : ' + dbId + ' country:' + country);		
		
				
		//var filepath = 'd:\\bot1\\xls\\configData.xlsx';
		//var fvalue = 'connection';
		//var field = 'Type';
		//console.log('path --> ' + filepath);
		var emailData=[];
		//var data = configData(filepath,branch);
		
		//console.log('Data : ' + data.Username);
		
		/*configData(filepath, field, fvalue, function(data) {
				//console.log('Data : ' + data); 
				var tmpPath = 'd:\\bot1\\';   // '.\\'
				var connpath = tmpPath  + data.Folder + '\\'+ data.Filename;
				//console.log(connpath);
				var fvalue = dbId;
				var field = 'Branch';
				//console.log ('config -->' + field + ' ' + fvalue );
				configData(connpath, field, fvalue, function(connData) {
					console.log('Conn Data : ' + connData);
						dbConfig ['domain'] =  'MASTEK';
						dbConfig ['user'] = connData.Username;
						dbConfig ['password']= connData.Password;
						dbConfig ['server'] = connData.Host;
						dbConfig ['database']= connData.Database;
						emailData.push({'email': connData.BranchMail});
				});
				
		});	*/
		
		//data bring from xml
		
		//console.log('find xml :' + jsonXML.Connection.country);
		dbConfig = {};
		for(var i in jsonXML.Connection)
		{
			console.log('country ' + i);
			console.log(jsonXML.Connection[i]);	
			console.log();			
			if(i.toLowerCase() == country.toLowerCase()){
				var countryData = jsonXML.Connection[i];
				for(var j in countryData[0]){
					console.log('db ' +j);
					console.log(countryData[0][j]);
					if(j.toLowerCase() == dbId.toLowerCase()){
						var ln = countryData[0][j];
						console.log(ln[0].Host[0]);
						dbConfig ['domain'] =  'MASTEK';
						dbConfig ['user'] = ln[0].Username[0];
						dbConfig ['password']= ln[0].Password[0];
						dbConfig ['server'] = ln[0].Host[0];
						dbConfig ['database']= ln[0].Database[0];
						emailData.push({'email': ln[0].Email[0]});
						
					}
				}
			}
		}
		console.log('New connection ------> ' + JSON.stringify(dbConfig));
		var query = req.params.qstr;
		console.log(query);
		executeQuery (res, query, emailData);
	
	
});

//POST API
 app.post('/', function(req , res){
                var query = "INSERT INTO dbo.country (countrypseudo,countrydesc) VALUES ('" + req.body.countrypseudo + "','" + req.body.countrydesc + "')";
                executeQuery (res, query);
});

//PUT API
 app.put("/api/user/:id", function(req , res){
                var query = "UPDATE dbo.country SET countrydesc= '" + req.body.countrydesc  +  "'   WHERE countryid= " + req.params.id;
                executeQuery (res, query);
});

// DELETE API
 app.delete("/api/user/:id", function(req , res){
                var query = "DELETE FROM dbo.country WHERE countryid=" + req.params.id;
                executeQuery (res, query);
});

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}