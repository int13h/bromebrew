$(document).ready(function(){
  var conn;
  var msg = $("#msg");
  var log = $(".log_detail");

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

  if (!window["WebSocket"]) $(log).append("<div><b>Your browser does not support WebSockets.</b></div>");
  
  conn = new WebSocket("ws://192.168.1.2:8080/ws");
  conn.onclose = function(evt) {
    $(log).append("<div><b>Connection closed.</b></div>");
  }

  // incoming messages

  var hlmt = 200; // hard limit
  var mcnt = 0;   // limit counter

  conn.onmessage = function(evt) {

    // the message
    var json = JSON.parse(evt.data);

    //console.log(json);

    // either the log headers or an event
    switch (json.type) {
      case "loglist":
        console.log(json)
      break;
      case "header":
        mcnt = 0;
        hodr = [];
        hodr.length = 0;
        hdr2rm = 0;
        parseHeader(json);
      break;
      case "event":
        mcnt++;
        $(".rcnt").text(mcnt);
        if (mcnt <= hlmt) {
          $(".wcnt").text(mcnt);
          parseEvent(json);
        }
      break;
    }

  }

  // truncate
  function truncStr(s,l) {
    if (s.length > l) s = s.substring(0,l) + "..";
    return s;
  }

  // smoke and mirrors
  $(document).on('mouseenter', '.gobtn', function() { $(this).val("GO!"); });
  $(document).on('mouseleave', '.gobtn', function() { $(this).val("GO"); });

  //
  // click handlers
  //
  
  // row extensions
  $(document).on("click", ".row", function() {
    // multiple opens are allowed, close on re-click
    if ($(this).hasClass('rowactive')) {
      $(this).removeClass('rowactive');
      $(".rowext", this).remove();
      return;
    }

    // mark us as active
    $(this).addClass('rowactive');

    // add the extension
    var json = syntaxHighlight(h2s($(this).data('detail')));
    json = json.replace(/<\/span>,/g, "</span>,<br>");
    json = json.replace(/{/, "{<br>");
    json = json.replace(/}/, "<br>}");
    var rowext = "<div class=rowext>";
    rowext += json;
    rowext += "</div>";
    $(this).append(rowext);
  });

  $(document).on("click", ".rowext", function() { return });

  //
  // writers
  //

  var w, nhdrs;    // column width and number of columns
  var truncl = 10; // default truncate length

  function parseHeader(j) {

    // remove existing headers and rows
    if ($(".hdr")[0]) $(".hdr").remove();
    if ($(".row")[0]) $(".row").remove();

    // fields that we will hide
    var re = /(uid|orig_fuids|resp_fuids|uri|referrer|username|password)/;

    $.each(j.data.fields, function(i, v) {
      var RM = re.exec(v);
      if (!RM) {
        var hdr = "<div class=hdr>&nbsp;&nbsp;" + truncStr(v, truncl) +"</div>"
        $(".log_headers").append(hdr);
        hodr.push(v);
      } else {
        hdr2rm++;
      }
    });

    // get count(fields) and adjust columns to accommodate
    nhdrs = j.data.fields.length - hdr2rm;
    if (nhdrs > 0) w = Number(100/nhdrs) + "%";
    $(".hdr").css("width", w);
  }

  //
  // parse and create log entries
  //

  function parseEvent(j) {
    var detail = s2h(JSON.stringify(j.data));
    var row = "<div class=row "; 
    row += "data-detail=\"" + detail + "\">";

    for (var i = 0; i < hodr.length; i++) {
      var obj = j.data[hodr[i]];
      
      row += "<div class=rowobj ";
      row += "title=\"" + obj + "\">&nbsp;&nbsp;";
      
       // show an ip if we can 
      var re = /(id.orig_h|id.resp_h)/;
      var TR = re.exec(hodr[i]);
      if (!TR || obj.length > 15) obj = truncStr(obj, truncl);
      row += obj + "</div>";
    }  

    row += "</div>"

    $(".log_detail").append(row);
    $(".rowobj").css("width", w);
  }

// The End  
});
