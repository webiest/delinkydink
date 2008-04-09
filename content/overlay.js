var prefs = Components.classes["@mozilla.org/preferences-service;1"]
  .getService(Components.interfaces.nsIPrefBranch);
prefs.setBoolPref("extensions.delinkydink.debug", false);

var Log = {
  serv: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
  log: function(message) {
    if (prefs.getBoolPref("extensions.delinkydink.debug")){
      this.serv.logStringMessage('DLD: '+message);
    }
  }
};

Log.log("Starting delinkydink");

var idle_time=0;
var pass = '';
var thisnetworkperson_global;
var deluser;
var failed_login_count=0;


function loadPass(){
  Log.log("Loading saved password");
  try{
    var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
      .getService(Components.interfaces.nsIPasswordManager);
    var queryString = 'api.del.icio.us:443 (del.icio.us API)';
    Log.log("Loading passwordmanager");
    var e = passwordManager.enumerator;
    while (e.hasMoreElements()) {
      try {
        var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
        if (pass.host == queryString) {
          Log.log("Returning password");
          return pass.password;
        }
      } catch (e) {
        Log.log(e);
        var pass = '';
      }
    }
  }catch(e){
    var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
      .getService(Components.interfaces.nsILoginManager);
    var logins = passwordManager.getAllLogins({});
    Log.log("Loading login-manager");
    for (var i = 0; i < logins.length; i++) {
      if (logins[i].hostname == "https://api.del.icio.us") {
        Log.log("Returning password");
        return logins[i].password;
      }
    }
  }
  return '';
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
        Log.log("onClickCommand = "+thisnetworkperson+deluser);
    doAjax("POST",'https://api.del.icio.us/v1/posts/add?',state_Change_onClickCommand,deluser,loadPass());
    thisnetworkperson_global=thisnetworkperson;
    try {
      var send_private = (prefs.getCharPref("extensions.delinkydink.send_privately")=="true")?"&shared=no":"";
    }catch(e){
      var send_private = "";
    }
    req.send("&url="+escape(getURLinfo())+"&description="+escape(getURLinfo('title'))+"&tags="+escape("for:"+thisnetworkperson)+send_private);
  }
};

window.addEventListener("load", function(e) { Delinkydink.onLoad(e); }, false);
window.addEventListener("click", function(e) { idle_time=0; }, false);

function state_Change_onClickCommand() {
  Log.log("state_Change_onClickCommand = "+req.readyState);
  if (req.readyState==4) {
    if (req.status==200){
      var xmlDoc=req.responseXML.documentElement;
      xmlDoc.getElementsByTagName("result");
      if(xmlDoc.attributes.getNamedItem("code").value=="done"){
        try {
          var sent_private = (prefs.getCharPref("extensions.delinkydink.send_privately")=="true")?" (privately)":"";
        }catch(e){
          var sent_private = "";
        }
        showNotificationWindow(getURLinfo('title'),"Sent To "+thisnetworkperson_global+sent_private, '', false);
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
  doAjax('POST','https://api.del.icio.us/v1/posts/get?',state_Change_initialLogin);
  req.send(null);
}

function state_Change_initialLogin() {
  if (req.readyState==4) {
    if (req.status==200){
      var xmlDoc=req.responseXML.documentElement;
      xmlDoc.getElementsByTagName("posts");
      prefs.setCharPref("extensions.delinkydink.username",xmlDoc.attributes.getNamedItem("user").value);
      deluser=xmlDoc.attributes.getNamedItem("user").value;
      loadPass();
      getNetwork();
    }else{
      showNotificationWindow("Error:",req.responseText,'',false);  
    }
  }
}

function getNetwork() {
  this_link='http://feeds.delicious.com/feeds/json/network/'+prefs.getCharPref("extensions.delinkydink.username");
  doAjax('GET',this_link,state_Change_getNetwork);
  req.send(null);
}

function state_Change_getNetwork() {
  Log.log("readystate= "+req.readyState+" "+req.status);
  if (req.readyState==4) {
    if (req.status==200) {
      var mynetwork = eval('(' + req.responseText + ')');
      Log.log(mynetwork);
      var element = document.getElementById("delinkymenu");
      while (element.firstChild && element.firstChild.id!="delinkydink_options") {
      Log.log(element.firstChild.id);
        element.removeChild(element.firstChild);
      }
      for (var i=0, name; name=mynetwork[i]; i++) {
        Log.log(name+i);
        var NewMenuItem = document.createElement("menuitem");
          NewMenuItem.setAttribute("label",name);
          NewMenuItem.setAttribute("onmouseup","Delinkydink.onClickCommand('"+name+"');");
          document.getElementById('delinkymenu').appendChild(NewMenuItem);
        var NewMenuItem2 = document.createElement("menuitem");
          NewMenuItem2.setAttribute("id","auto_open_from_"+name);
          NewMenuItem2.setAttribute("label",name);
          NewMenuItem2.setAttribute("type","checkbox");
          NewMenuItem2.setAttribute("oncommand","savePref('auto_open_from_"+name+"');");
          try {
            Log.log("trying...");
            var CheckedAttr2 = document.createAttribute("checked");
            CheckedAttr2.nodeValue = (prefs.getCharPref("extensions.delinkydink.auto_open_from_"+name)=="true");
            NewMenuItem2.setAttributeNode(CheckedAttr2);
          }catch(e){}
          document.getElementById('auto_open_people').appendChild(NewMenuItem2);
      }
      try {
        document.getElementById('send_privately').setAttribute("checked",(prefs.getCharPref("extensions.delinkydink.send_privately")=="true"));
      }catch(e){}
      try {
        document.getElementById('delete_after_sending').setAttribute("checked",(prefs.getCharPref("extensions.delinkydink.delete_after_sending")=="true"));
      }catch(e){}
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
  if(deluser!='' && idle_time < 10){
    idle_time++;
    doAjax2('get','http://del.icio.us/for/'+deluser,state_Change_checkLinks);
    req2.send(null);
  }
  setTimeout(function(){checkLinks()},10000);
}

function state_Change_checkLinks() {
  Log.log("state_Change_checkLinks= "+req2.readyState+" "+req2.status);
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
      pos2 = response.indexOf('in order to save an item, you have to log in', 0);
      if (pos + pos2 > 0){
        failed_login_count++;
        doAjax("POST", 'https://secure.del.icio.us/login/?', state_Change_default);
        req.send("&user_name="+deluser+"&password="+loadPass());
        if(failed_login_count==1){
          showNotificationWindow("Please login to del.icio.us as "+prefs.getCharPref("extensions.delinkydink.username")+" to retrieve your \"links for you\"","To stop this alert, check \"Use Password Manager to remember this password\" when you login.",'',false);  
          gBrowser.selectedTab = gBrowser.addTab("https://secure.del.icio.us/login");
        }
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
      try{
        var open_link_from_user = prefs.getCharPref("extensions.delinkydink.auto_open_from_"+freshlinks_users[j]);
        Log.log("open from user="+open_link_from_user);
      }catch(e){Log.log(e);}
      if(open_link_from_user == 'true') {
        gBrowser.addTab(decodeHtml(thisfreshlink));
      }
      showNotificationWindow(thisfreshlinkheader,thisfreshlinktitle,thisfreshlink);
      j++;
      open_link_from_user="false";
    }, i*6000);
  }
}

var showNotificationWindow = function(label, value, link, linkit) {
  var alertWin = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
    .getService(Components.interfaces.nsIWindowWatcher)
    .openWindow(null, "chrome://global/content/alerts/alert.xul", "_blank", "chrome,titlebar=no,popup=yes", null);
    alertWin.arguments = ["chrome://delinkydink/skin/delinkydink.png", label, value, linkit, link, 0, openLinkNotify];
    alertWin.setTimeout(function(){alertWin.close()},10000);
};

var openLinkNotify = {
  observe: function(subject, topic, data) {
    if(topic == 'alertclickcallback') {
      gBrowser.selectedTab = gBrowser.addTab(data);
    }
  }
};

function savePref(name){
  prefs.setCharPref("extensions.delinkydink."+name,document.getElementById(name).getAttribute("checked"));
}

function decodeHtml(s){
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>;').replace(/&quot;/g,'\"')
}

function openLinksForYou(){
  gBrowser.selectedTab = gBrowser.loadURI('http://del.icio.us/for/'+deluser);
}