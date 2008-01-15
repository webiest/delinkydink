var Delinkydink = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
    window.open("chrome://delinkydink/content/hello.xul", "", "chrome");
  }
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false); 