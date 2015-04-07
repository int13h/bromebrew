$(document).ready(function(){
  var conn;
  var msg = $("#msg");
  var log = $(".log_detail");

  function appendLog(msg) {
    var d = log[0]
    var doScroll = d.scrollTop == d.scrollHeight - d.clientHeight;
    msg.appendTo(log)
    if (doScroll) {
      d.scrollTop = d.scrollHeight - d.clientHeight;
    }
  }

  // Callbacks
  $("#form").submit(function() {
    if (!conn) {
      return false;
    }
    if (!msg.val()) {
      return false;
    }
    conn.send(msg.val());
    msg.val("");
    return false
  });

  if (window["WebSocket"]) {
    conn = new WebSocket("wss://bromebrew-int13h.c9.io/ws");
    conn.onclose = function(evt) {
      appendLog($("<div><b>Connection closed.</b></div>"))
    }
    conn.onmessage = function(evt) {
      appendLog($("<div/>").text(evt.data))
    }
  } else {
    appendLog($("<div><b>Your browser does not support WebSockets.</b></div>"))
  }
});
