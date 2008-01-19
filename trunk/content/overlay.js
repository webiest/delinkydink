var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);

var clickcount=0;
var the_package;
var thisnetworkperson_global;

var Delinkydink = {
	onLoad: function() {
	Log.log("Running checkLinks");		
	
		this.initialized = true;
		checkLinks();
		if(prefs.getCharPref("extensions.delinkydink.username")==undefined || prefs.getCharPref("extensions.delinkydink.username")==''){
		Log.log("initial login");
			initialLogin();
		}else{
		initialLogin();
			Log.log("Running getNetwork");		
			getNetwork();
			
				
		}		 		
	},
  
	onClickCommand: function(thisnetworkperson) {
		clickcount++;
		if(clickcount == 1){
			doAjax('POST','https://api.del.icio.us/v1/posts/add?',state_Change_del);
			the_package="&url="+escape(getURL())+"&description="+escape(getTITLE())+"&tags="+escape("for:"+thisnetworkperson);
			thisnetworkperson_global=thisnetworkperson;
			req.send(the_package); 
		}else{
			clickcount=0;
		}
	}
};



function doAjax(method,link,callback){
	req = new XMLHttpRequest();
	req.open(method, link, true);
	req.setRequestHeader('User-Agent', 'Delinkydink');
	req.setRequestHeader('Accept-Charset','utf-8');
	req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	req.onreadystatechange=callback;
}

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 


function initialLogin(){
			prefs.setIntPref('extensions.delinkydink.interval', 10);
			doAjax('POST','https://api.del.icio.us/v1/posts/get?',state_Change_username);
			req.send(null);
}

function getNetwork(){
Log.log('http://del.icio.us/feeds/json/network/'+prefs.getCharPref("extensions.delinkydink.username"));
	doAjax('get','http://del.icio.us/feeds/json/network/'+prefs.getCharPref("extensions.delinkydink.username"),state_Change);
	req.send(null);
}

function getURL() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return recentWindow ? recentWindow.content.document.location : null;
}

function getTITLE() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return recentWindow.content.document.title ? recentWindow.content.document.title : "No Title";
}

function state_Change_username() {
	if (req.readyState==4) {
		if (req.status==200){
			var xmlDoc=req.responseXML.documentElement;
			xmlDoc.getElementsByTagName("posts");
			prefs.setCharPref("extensions.delinkydink.username",xmlDoc.attributes.getNamedItem("user").value);
			getNetwork();
		}else{
			showNotificationWindow("Error:",req.responseXML,false);	
		}
	}
}


function state_Change_del() {
	if (req.readyState==4) {
		if (req.status==200){
		var xmlDoc=req.responseXML.documentElement;
		xmlDoc.getElementsByTagName("result");
		if(xmlDoc.attributes.getNamedItem("code").value=="done"){	
			showNotificationWindow(getTITLE(),"Sent To "+thisnetworkperson_global, false);	
			thisnetworkperson_global='';
		}else{
			showNotificationWindow("Error:",req.responseText,false);	
		}
	} else {
		showNotificationWindow("Problem retrieving data from del","-");	
    }
  }
}

function checkLinks(){
	Log.log("Checking links");
	doAjax('get','http://del.icio.us/for/'+prefs.getCharPref("extensions.delinkydink.username"),state_Change_checkLinks);
	req.send(null);
	setTimeout(function(){checkLinks()},prefs.getIntPref("extensions.delinkydink.interval")*2000);
}

function state_Change_checkLinks() {
	if (req.readyState==4) {
		if (req.status==200){
			var pos=-1;
			var endpos=-1;
			var freshlinks=new Array();
			var freshlinks_titles=new Array();
			response = req.responseText;
			Log.log(response);
			pos = response.indexOf('links for you (', pos+1);
			if( pos > 0){
				endpos = response.indexOf('"post first-old-post"', pos+1);
				new_links = response.substring(pos, endpos+5);
				link_scrape_endpos=endpos;
				while (pos < link_scrape_endpos){
					pos = response.indexOf('<h4 class=\"desc\"><a href=\"', pos+1);
					endpos = response.indexOf('\" rel=\"', pos+1);
					thislink = response.substring(pos+26, endpos);
					
					pos2 = response.indexOf('nofollow\">', endpos+1);
					endpos2 = response.indexOf('</a>', pos2+1);
					thistitle = response.substring(pos2+10, endpos2);
					
					freshlinks.push(thislink);
					freshlinks_titles.push(thistitle);
			    }
				sendTheLinks(freshlinks,freshlinks_titles);
			}
			pos = response.indexOf('You have to be logged in', 0); 
			Log.log(pos);
			if (pos > 0){
				showNotificationWindow("Please login to del.icio.us as "+prefs.getCharPref("extensions.delinkydink.username")+" to retrieve your \"links for you\"","");	
				gBrowser.selectedTab = gBrowser.addTab("https://secure.del.icio.us/login");	
			}			
		}
	}
}		

function sendTheLinks(freshlinks,freshlinks_titles){
	var j=0;
	for(i=0;i<freshlinks.length;i++){
		setTimeout(function() { 
			thisfreshlinktitle=freshlinks_titles[j];
			thisfreshlink=freshlinks[j];
			j++;
			showNotificationWindow(thisfreshlinktitle,thisfreshlink)
		}, (i+1)*6000);
	}
}				
function state_Change() {
Log.log(req.readyState);
Log.log(req.status);

	if (req.readyState==4) {
		if (req.status==200){
			Log.log(req.responseText);
			var mynetwork = eval('(' + req.responseText + ')');
			var element = document.getElementById("delinkymenu");
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
			for (var i=0, name; name=mynetwork[i]; i++) {
				newElement = document.createElement("menuitem");
			    var node = newElement
				var a = document.createAttribute("label");
				a.nodeValue = name;
				node.setAttributeNode(a);
				var b = document.createAttribute("onclick");
				b.nodeValue = "Delinkydink.onClickCommand('"+name+"')";
				node.setAttributeNode(b);
				var c = document.createAttribute("onmouseup");
				c.nodeValue = "Delinkydink.onClickCommand('"+name+"')";
				node.setAttributeNode(c);
				document.getElementById('delinkymenu').appendChild(newElement); 
			}
			
			newElement = document.createElement("menuseparator");
			document.getElementById('delinkymenu').appendChild(newElement); 
			newElement = document.createElement("menuitem");
			var node = newElement
			var d = document.createAttribute("label");
			d.nodeValue = "Logout ("+prefs.getCharPref("extensions.delinkydink.username")+")";
			node.setAttributeNode(d);
			var e = document.createAttribute("onclick");
			e.nodeValue = "doLogout();";
			node.setAttributeNode(e);
			var f = document.createAttribute("onmouseup");
			f.nodeValue = "doLogout();";
			node.setAttributeNode(f);
			document.getElementById('delinkymenu').appendChild(newElement); 
		} else {
			showNotificationWindow("Problem retrieving data from del","-");	
		}
	}
}

function doLogout(){
	var element = document.getElementById("delinkymenu");
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
	newElement = document.createElement("menuitem");
	var node = newElement
	var d = document.createAttribute("label");
	d.nodeValue = "Login";
	node.setAttributeNode(d);
	var e = document.createAttribute("onclick");
	e.nodeValue = "initialLogin();";
	node.setAttributeNode(e);
	var f = document.createAttribute("onmouseup");
	f.nodeValue = "initialLogin();";
	node.setAttributeNode(f);
	document.getElementById('delinkymenu').appendChild(newElement); 
	
    //var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
    //                            .getService(Components.interfaces.nsIPasswordManager);
	//passwordManager.addUser('api.del.icio.us:443 (del.icio.us API)', prefs.getCharPref("extensions.delinkydink.username"), '');						
	//prefs.setCharPref("extensions.delinkydink.username",'')
	gBrowser.selectedTab = gBrowser.addTab("http://del.icio.us/logout");	
	//showNotificationWindow("Restart firefox to change del.icio.us users","",false);	
}  


var Log = {
  serv: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  log: function(message) {
    this.serv.logStringMessage('DLD: '+message);
  }
};  

var showNotificationWindow = function(label, value, linkit)
{
  if(linkit==undefined){linkit=true;}
  image ="chrome://delinkydink/skin/delinkydink.png"
  try
  {
	var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
                              .getService(Components.interfaces.nsIAlertsService);
	alertsService.showAlertNotification(image, label, value, linkit, "http://google.com", openLinkNotify);
  }
  catch(e)
  {
    try
    {
      var alertWin = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher)
        .openWindow(null, "chrome://global/content/alerts/alert.xul", "_blank", "chrome,titlebar=no,popup=yes", null);
        alertWin.arguments = [image, label, value, true, "link_url", 0, openLinkNotify];
        alertWin.setTimeout(function(){alertWin.close()},10000);
    }
    catch(e)
    {}
  }
};

var openLinkNotify =
{
  observe: function(subject, topic, data)
  {
    if(topic == 'alertclickcallback')
    {
      gBrowser.selectedTab = gBrowser.addTab(data);	 
    }
  }
};