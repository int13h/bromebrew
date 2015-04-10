var Bromebrew = {}

$(document).ready(function(){
  var conn;
  var msg = $("#msg");

  // client requests to socket 
  $(document).on('click', '.fa-log', function() {
    if (!conn) {
      return false;
    }

    if ($(this).hasClass('fa-log-active')) {
      return false;
    } else {
      $("#tbl-detail").hide();
      $(".loader").show();
      $(".fa-log-active").removeClass("fa-log-active");
    }

    // mark us as active
    $(this).addClass('fa-log-active');

    if (Bromebrew.table) {
      Bromebrew.table.destroy();
    }  

    var reqlog = $(this).text() + ".log"; 

    conn.send(reqlog);
    return false
  });

  if (!window["WebSocket"]) $(log).append("<div><b>Your browser does not support WebSockets.</b></div>");
  
  conn = new WebSocket("ws://192.168.1.2:8080/ws");

  conn.onclose = function(evt) {
    $(log).append("<div><b>Connection closed.</b></div>");
  }

  // incoming messages

  var hodr = [];  // field order

  conn.onmessage = function(evt) {

    // the message
    var json = JSON.parse(evt.data);

    // DEBUG
    //console.log(json); 

    // either the log headers or an event
    switch (json.type) {
      case "loglist":
        parseLoglist(json.data)
      break;
      case "header":
        hodr.length = 0;
        parseHeader(json);
      break;
      case "event":
      parseEvent(json);
      break;
      case "EOF": // when the socket is done, we send EOF
        
        Bromebrew.table = $('#tbl-detail').DataTable({
          "iDisplayLength":25,
          "order": [[ 0, "desc"]],
        });

        $(".loader").hide();
        $("#tbl-detail").fadeIn();
        
      break;
    }

  }

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
    json = json.replace(/<\/div>,/g, "</div>,<br>");
    json = json.replace(/{/, "{<br>");
    json = json.replace(/}/, "<br>}");
    var rowext = "<div class=rowext>";
    rowext += json;
    rowext += "</div>";
    $(this).append(rowext);
  });

  //
  // writers
  //

  // log list
  function parseLoglist(j) {

    $.each(j, function(i, v) {
      var ln = v.replace(/\.log$/, "");
      $(".fa-logs").append("<div class=fa-log>" + ln + "</div>");
    });

  }

  // table headers
  function parseHeader(j) {

    // remove existing headers and rows
    $("#tbl-detail-hdr, #tbl-detail-row").html("");

    // fields that we will hide
    var re = /(uid|orig_fuids|resp_fuids|uri|referrer|username|password)/; // put this in the UI
    var hdr = "<tr>";

    $.each(j.data.fields, function(i, v) {
      var RM = re.exec(v);
      if (!RM) {
        hdr += "<th>" + v + "</th>"
        hodr.push(v); // keep track of the headings 
      }
    });

    hdr += "</tr>;"

    $("#tbl-detail-hdr").html(hdr);

  }

  // table rows
  function parseEvent(j) {
    var detail = s2h(JSON.stringify(j.data));

    var row = "<tr data-detail=\"" + detail + "\">";

    for (var i = 0; i < hodr.length; i++) {

      var hdr = hodr[i]; 
      var obj = j.data[hdr];

      // make timestamp more interesting at parties
      if (hdr == "ts") {
        // are we utime?
        var re = /^(\d{10}\.\d{6}|\d{10})$/;
        var OK = re.exec(obj);
        if (OK) {
          var tv = Number(obj.split(".")[0] * 1000);
          obj = mkStamp(tv,0,0);
        }
      }

      row += "<td>" + obj + "</td>";
    }  

    row += "</tr>";

    $("#tbl-detail-row").append(row);
  }

// The End  
});
