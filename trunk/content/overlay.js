var Delinkydink = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
    window.open("chrome://delinkydink/content/delinkydink.xul", "", "chrome");
  }
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 

function getURL() {
	
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
  var recentWindow = wm.getMostRecentWindow("navigator:browser");
  return  recentWindow ? recentWindow.content.document.location : null;
  }