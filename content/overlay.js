var prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);
var Delinkydink = {
	onLoad: function() {
	this.initialized = true;
	},
  
	onClickCommand: function() {
		req = new XMLHttpRequest();
		network_link='http://del.icio.us/network/'+prefs.getCharPref("extensions.delinkydink.username");
		alert (network_link);
		req.open('get', network_link, true);
		req.setRequestHeader('User-Agent', 'blah blah');
		req.setRequestHeader('Accept-Charset','utf-8');
		req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		Log.log('unr = false');
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
		alert ('readystate=4');
		alert (req.responseText);
		var t=req.responseText.getElementsByTagName("title");
		alert(t);
	if (req.status==200){
    // ...some code here...
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