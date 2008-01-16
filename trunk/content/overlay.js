var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);
var Delinkydink = {
	onLoad: function() {
	this.initialized = true;
	},
  
	onClickCommand: function() {
		req = new XMLHttpRequest();
		network_link='http://del.icio.us/network/'+prefs.getCharPref("extensions.delinkydink.username");
		Log.log(network_link);
		req.open('get', network_link, true);
		req.setRequestHeader('User-Agent', 'blah blah');
		req.setRequestHeader('Accept-Charset','utf-8');
		req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');

		req.onreadystatechange=state_Change;
		req.send(null); 		
	},
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 

function getURL() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return  recentWindow ? recentWindow.content.document.location : null;
}


function state_Change() {
	if (req.readyState==4) {
	if (req.status==200){
		Log.log("got response");
		var pos=-1;
		var endpos=-1;
		response = req.responseText;
		
		pos = response.indexOf('<li class=\"bundle fold\">', pos+1);
		endpos = response.indexOf('<div class=\"mutualKey\">mutual connection</div>', pos+1);
		network_peeps = response.substring(pos, endpos+5);
		

		Log.log(network_peeps);
	  
	} else {
		alert("Problem retrieving XML data");
    }
  }
}
  
  
var Log =
{
  // mozilla log service
  serv: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  /**
   * @param {String} message
   */
  log: function(message){
    this.serv.logStringMessage('DLD: '+message);
  }
};  