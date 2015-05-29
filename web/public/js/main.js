var Bromebrew = {}

$(document).ready(function(){
  var conn;
  var msg = $("#msg");

  // client requests to socket 
  $(document).on('click', '.fl-log', function() {
    if (!conn) {
      return false;
    }

    if ($(this).hasClass('fl-log-active')) {
      return false;
    } else {
      $("#tbl-detail").hide();
      $(".loader").show();
      $(".fl-log-active").removeClass("fl-log-active");
    }

    // mark us as active
    $(this).addClass('fl-log-active');

    if (Bromebrew.table) {
      Bromebrew.table.destroy();
    }  

    var reqlog = $(this).text() + ".log"; 

    conn.send(reqlog);
    return false;
  });

  if (!window["WebSocket"]) $(log).append("<div><b>Your browser does not support WebSockets.</b></div>");
  
  conn = new WebSocket("wss://192.168.1.2:8080/ws");

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

    // list of logs | log headers | log row | end of log
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
      case "EOF":
        createTable();
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

  // column toggle (single)
  $(document).on("click", ".toggle", function() {
    var c = $(this);
    Bromebrew.table.column(c.data('col')).visible(c.is(":checked"), false);
    var tblw = $('#tbl-detail').width();
    $('.controls').width(tblw);
  });

  // column toggle (all)
  $(document).on("click", ".toggle-all", function() {
    var c = $(".toggle");
    Bromebrew.table.column(c.data('col')).visible(c.is(":checked"), false);
    var tblw = $('#tbl-detail').width();
    $('.controls').width(tblw);
  });

  //
  // writers
  //

  // log list
  function parseLoglist(j) {
    $.each(j, function(i, v) {
      var ln = v.replace(/\.log$/, "");
      $(".fl-logs").append("<div class=fl-log>" + ln + "</div>");
    });
  }

  // table headers and column toggles
  function parseHeader(j) {

    // remove existing headers and rows
    $("#tbl-detail-hdr, #tbl-detail-row").html("");

    var hdr = "<tr>";
    var cols = "";

    $.each(j.data.fields, function(i, v) {
      hdr += "<th>" + v + "</th>";
      hodr.push(v); // keep track of the headings
      cols += "<div class=toggles>";
      cols += "<input class=toggle type=checkbox data-col=" + i + " checked>" + v; 
      cols += "</div>";
    });

    hdr += "</tr>;"

    $("#tbl-detail-hdr").html(hdr);
    $(".toggle-column").html(cols);

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

  // create table
  function createTable() {
    Bromebrew.table = $('#tbl-detail').DataTable({
      "iDisplayLength":15,
      "order": [[ 0, "desc"]],
    });

    $(".loader").hide();
    $('.more').hide();
    $("#tbl-detail").fadeIn();

    var tblw = $('#tbl-detail').width();
    $('.controls').width(tblw);
  }

  // toggle 'more this way' animation
  // $(window).scroll(function() {
    // var sl = $(document).scrollLeft();
    // var vs = $('.more').css('display');
    // if (sl > 0 && vs != 'hidden') {
      // $('.more').fadeOut();
    // } else {
      // $('.more').fadeIn(); 
    // }
  // });

// The End  
});
