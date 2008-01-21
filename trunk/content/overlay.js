var Log = {
  serv: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  log: function(message) {
    this.serv.logStringMessage('DLD: '+message);
  }
};  

Log.log("Starting delinkydink");

var prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefBranch);
var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
				.getService(Components.interfaces.nsIPasswordManager);
var queryString = 'api.del.icio.us:443 (del.icio.us API)';


var pass = '';
var clickcount=0;
var the_package;
var thisnetworkperson_global;
var deluser;

var e = passwordManager.enumerator;
while (e.hasMoreElements()) {
    try {
        var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
    } catch (ex) {
        var pass = '';
    }
}			
			   

var Delinkydink = {
	onLoad: function() {
	this.initialized = true;
	try {
		deluser=prefs.getCharPref("extensions.delinkydink.username");
		getNetwork();
	}
	catch(e) {
		deluser = '';
		initialLogin();
	}

	checkLinks();
	},
  
	onClickCommand: function(thisnetworkperson) {
			doAjax("POST",'https://api.del.icio.us/v1/posts/add?',state_Change_onClickCommand,pass.user,pass.password);
			the_package="&url="+escape(getURLinfo())+"&description="+escape(getURLinfo('title'))+"&tags="+escape("for:"+thisnetworkperson);
			thisnetworkperson_global=thisnetworkperson;
			req.send(the_package); 
	}
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 

function state_Change_onClickCommand() {
Log.log("state_Change_onClickCommand = "+req.readyState);
	if (req.readyState==4) {
		if (req.status==200){
			var xmlDoc=req.responseXML.documentElement;
			xmlDoc.getElementsByTagName("result");
			if(xmlDoc.attributes.getNamedItem("code").value=="done"){	
				showNotificationWindow(getURLinfo('title'),"Sent To "+thisnetworkperson_global, '', false);	
				thisnetworkperson_global='';
			}else{
				showNotificationWindow("Error:",req.responseText,'',false);	
			}
		} else {
			showNotificationWindow("Problem retrieving data from del",'','',false);	
		}
	}
}

function doAjax(method,link,callback,username,password){
	Log.log("doAjax "+link);
	req = new XMLHttpRequest();
	req.open(method, link, true, username, password);
	req.setRequestHeader('User-Agent', 'Delinkydink2');
	req.setRequestHeader('Accept-Charset','utf-8');
	req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	req.onreadystatechange=callback;
}

function doAjax2(method,link,callback){
	Log.log("doAjax2 "+link);
	req2 = new XMLHttpRequest();
	req2.open(method, link, true);
	req2.setRequestHeader('User-Agent', 'Delinkydink2');
	req2.setRequestHeader('Accept-Charset','utf-8');
	req2.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	req2.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	req2.onreadystatechange=callback;
}

function initialLogin(){
	prefs.setIntPref('extensions.delinkydink.interval', 10);
	doAjax('POST','https://api.del.icio.us/v1/posts/get?',state_Change_initialLogin);
	req.send(null);
}

function state_Change_initialLogin() {
	if (req.readyState==4) {
		if (req.status==200){
			var xmlDoc=req.responseXML.documentElement;
			xmlDoc.getElementsByTagName("posts");
			prefs.setCharPref("extensions.delinkydink.username",xmlDoc.attributes.getNamedItem("user").value);
			getNetwork();
		}else{
			showNotificationWindow("Error:",req.responseText,'',false);	
		}
	}
}

function getNetwork() {
	this_link='http://del.icio.us/feeds/json/network/'+prefs.getCharPref("extensions.delinkydink.username");
	doAjax('GET',this_link,state_Change_getNetwork);
	req.send(null);
}

function state_Change_getNetwork() {
	if (req.readyState==4) {
		if (req.status==200) {
			var mynetwork = eval('(' + req.responseText + ')');
			var element = document.getElementById("delinkymenu");
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
			for (var i=0, name; name=mynetwork[i]; i++) {
				var NewMenuItem = document.createElement("menuitem");
				var LabelAttr = document.createAttribute("label");
                var OnmouseupAttr = document.createAttribute("onmouseup");
                
				LabelAttr.nodeValue = name;
				OnmouseupAttr.nodeValue = "Delinkydink.onClickCommand('"+name+"');";

				NewMenuItem.setAttributeNode(LabelAttr);
				NewMenuItem.setAttributeNode(OnmouseupAttr);
				
				document.getElementById('delinkymenu').appendChild(NewMenuItem); 
			}
		} 
		else {
			showNotificationWindow("Problem retrieving data from del.icio.us!","-");	
		}
	}
}

function getURLinfo(type) {
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
		   
	var recentWindow = wm.getMostRecentWindow("navigator:browser");
	if (type=="title") {
		return recentWindow.content.document.title ? recentWindow.content.document.title : "No Title";
	} else {
		return recentWindow ? recentWindow.content.document.location : null;
	}
}

function checkLinks(){
	doAjax2('get','http://del.icio.us/for/'+deluser,state_Change_checkLinks);
	req2.send(null);
	setTimeout(function(){checkLinks()},prefs.getIntPref("extensions.delinkydink.interval")*2000);
}

function state_Change_checkLinks() {
	if (req2.readyState==4) {
		if (req2.status==200){
			var pos=-1;
			var endpos=-1;
			var freshlinks=new Array();
			var freshlinks_titles=new Array();
			var freshlinks_users=new Array();
			var freshlinks_times=new Array();
						
			response = req2.responseText;
			pos = response.indexOf('links for you (', pos+1);
			if( pos > 0){
				link_scrape_endpos = response.indexOf('"post first-old-post"', pos+1);
				while (pos < link_scrape_endpos){
					pos = response.indexOf('<h4 class=\"desc\"><a href=\"', pos+1);
					endpos = response.indexOf('\" rel=\"', pos+1);
					thislink = response.substring(pos+26, endpos);
					pos2 = response.indexOf('nofollow\">', endpos+1);
					endpos2 = response.indexOf('</a>', pos2+1);
					thistitle = response.substring(pos2+10, endpos2);
					pos3 = response.indexOf('class=\"user\">', endpos2+1);
					endpos3 = response.indexOf('</a>', pos3+1);
					thislinkuser = response.substring(pos3+13, endpos3);
					pos4 = response.indexOf('<span class=\"date\" title=\"', endpos3+1);
					endpos4 = response.indexOf('</span>', pos4+1);
					thislinkuserdate = response.substring(pos4+48, endpos4);
					if(pos < link_scrape_endpos){
						freshlinks.push(thislink);
						freshlinks_titles.push(thistitle);
						freshlinks_users.push(thislinkuser);
						freshlinks_times.push(thislinkuserdate);
					}
			    }
				sendTheLinks(freshlinks,freshlinks_titles,freshlinks_users,freshlinks_times);
			}
			pos = response.indexOf('You have to be logged in', 0); 
			if (pos > 0){
				doAjax("POST", 'https://secure.del.icio.us/login/?', state_Change_default,pass.user,pass.password);
				req.send("&username="+pass.user+"&password="+pass.password);
				showNotificationWindow("Please login to del.icio.us as "+prefs.getCharPref("extensions.delinkydink.username")+" to retrieve your \"links for you\"","",'',false);	
				gBrowser.selectedTab = gBrowser.addTab("https://secure.del.icio.us/login");	
			}			
		}
	}
}		

function state_Change_default() {
	if (req.readyState==4) {
		if (req.status==200){
			//
		}
	}
}

function sendTheLinks(freshlinks,freshlinks_titles,freshlinks_users,freshlinks_times){
	var j=0;
	for(i=0;i<freshlinks.length;i++){
		setTimeout(function() { 
			var thisfreshlinktitle=freshlinks_titles[j];
			var thisfreshlink=freshlinks[j];
			var thisfreshlinkheader="From: "+freshlinks_users[j]+" "+freshlinks_times[j];
			j++;
			showNotificationWindow(thisfreshlinkheader,thisfreshlinktitle,thisfreshlink)
		}, (i+1)*6000);
	}
}				

var showNotificationWindow = function(label, value, link, linkit) {
	if(linkit==undefined){linkit=true;}
	var image ="chrome://delinkydink/skin/delinkydink.png"
	try {
		var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
                              .getService(Components.interfaces.nsIAlertsService);
		alertsService.showAlertNotification(image, label, value, linkit, link, openLinkNotify);
	}
	catch(e) {
		try { //for linux, needs testing
			var alertWin = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
			.getService(Components.interfaces.nsIWindowWatcher)
			.openWindow(null, "chrome://global/content/alerts/alert.xul", "_blank", "chrome,titlebar=no,popup=yes", null);
			alertWin.arguments = [image, label, value, linkit, link, 0, openLinkNotify];
			alertWin.setTimeout(function(){alertWin.close()},10000);
		}
		catch(e)
		{}
	}
};

var openLinkNotify = {
  observe: function(subject, topic, data) {
    if(topic == 'alertclickcallback') {
      gBrowser.selectedTab = gBrowser.addTab(data);	 
    }
  }
};

