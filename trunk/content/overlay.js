var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);

var clickcount=0;

function checkLinks(){
	req = new XMLHttpRequest();
	network_link='http://del.icio.us/for/'+prefs.getCharPref("extensions.delinkydink.username");
	req.open('get', network_link, true);
	req.setRequestHeader('User-Agent', 'Delinkydink');
	req.setRequestHeader('Accept-Charset','utf-8');
	req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	req.onreadystatechange=state_Change_get_links;
	req.send(null);
	setTimeout(function(){checkLinks()},prefs.getIntPref("extensions.delinkydink.interval")*2000);
}
					
var Delinkydink = {
	onLoad: function() {
		this.initialized = true;
		checkLinks();		
		//prefs.setCharPref('extensions.delinkydink.lasturl', "www.google.com");
		
		if(prefs.getCharPref("extensions.delinkydink.username")==undefined || prefs.getCharPref("extensions.delinkydink.username")==''){
			prefs.setIntPref('extensions.delinkydink.interval', 10);
			window.openDialog("chrome://delinkydink/content/options.xul", 'Delinkydink', 'chrome,titlebar,toolbar,centerscreen,modal');
		}else{
			req = new XMLHttpRequest();
			network_link='http://del.icio.us/network/'+prefs.getCharPref("extensions.delinkydink.username");
		
			req.open('get', network_link, true);
			req.setRequestHeader('User-Agent', 'Delinkydink');
			req.setRequestHeader('Accept-Charset','utf-8');
			req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			req.onreadystatechange=state_Change;
			req.send(null);
		}		 		
	},
  
	onClickCommand: function(thisperson) {
		clickcount++;
		if(clickcount == 1){
			req2 = new XMLHttpRequest();
			del_friend_link='https://api.del.icio.us/v1/posts/add?';
			req2.open('POST', del_friend_link, true);
			req2.setRequestHeader('User-Agent', 'Delinkydink');
			req2.setRequestHeader('Accept-Charset','utf-8');
			req2.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			req2.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			req2.onreadystatechange=state_Change_del;
			the_package="&url="+escape(getURL())+"&description="+escape(getTITLE())+"&tags=Delinkydink%20"+escape("for:"+thisperson);
		
			req2.send(the_package); 	
		}else{
			clickcount=0;
		}
	},
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 

function getURL() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return  recentWindow ? recentWindow.content.document.location : null;
}

function getTITLE() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return  recentWindow.title ? recentWindow.content.document.title : null;
}

function state_Change_del() {
	if (req2.readyState==4) {
		if (req2.status==200){
			alert(req2.responseText);
	} else {
		alert("Problem retrieving data from del");
    }
  }
}

function state_Change_get_links() {
	if (req.readyState==4) {
		if (req.status==200){
	
			var pos=-1;
			var endpos=-1;
			var i=0;
			var freshlinks=new Array();
			var freshlinks_titles=new Array();
			response = req.responseText;
			pos = response.indexOf('links for you (', pos+1);
			if(pos > 0){
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
			showNotification(thisfreshlinktitle,thisfreshlink)
		}, (i+1)*6000);
	}
}				
function state_Change() {
	if (req.readyState==4) {
		if (req.status==200){
			var pos=-1;
			var endpos=-1;
			var i=0;
			
			response = req.responseText;
			pos = response.indexOf('<li class=\"bundle fold\">', pos+1);
			endpos = response.indexOf('<div class=\"mutualKey\">mutual connection</div>', pos+1);
			network_peeps = response.substring(pos, endpos+5);
			scrape_endpos=endpos;
			while (pos < scrape_endpos){
				pos = response.indexOf('\" href=\"', pos+1);
				endpos = response.indexOf('">', pos+1);
				thisperson = response.substring(pos+9, endpos);
			    newElement = document.createElement("menuitem");
			    var node = newElement
				var a = document.createAttribute("label");
				a.nodeValue = thisperson;
				node.setAttributeNode(a);
				var b = document.createAttribute("onclick");
				b.nodeValue = "Delinkydink.onClickCommand('"+thisperson+"');";
				node.setAttributeNode(b);
				var c = document.createAttribute("onmouseup");
				c.nodeValue = "Delinkydink.onClickCommand('"+thisperson+"');";
				node.setAttributeNode(c);
				document.getElementById('delinkymenu').appendChild(newElement); 
			}
		} else {
			alert("Problem retrieving XML data");
		}
	}
}
  
var Log = {
  serv: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  log: function(message) {
    this.serv.logStringMessage('DLD: '+message);
  }
};  

var showNotification = function(label, value)
{

  image ="chrome://mozapps/skin/downloads/downloadIcon.png"
  try
  {
    /**
     * Notifier for Windows
     */
	 
	var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
                              .getService(Components.interfaces.nsIAlertsService);
	alertsService.showAlertNotification(image, label, value, true, "http://google.com", openLinkNotify);
  }
  catch(e)
  {
    try
    {
      /**
      * Notifier for Linux
      */
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
      //GRCheck.openReader();
	  gBrowser.selectedTab = gBrowser.addTab(data);
	 alert(prefs.getIntPref('extensions.delinkydink.nonexistent'));
	  //window.location=data;
    }
  }
};