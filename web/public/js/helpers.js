function d2h(d) {
  return d.toString(16);
}

function h2d(h) {
  return parseInt(h, 16);
}

function s2h(tmp) {
  var str = '', i = 0, tmp_len = tmp.length, c;
  for (; i < tmp_len; i += 1) {
    c = tmp.charCodeAt(i);
    str += d2h(c);
  }
  return str;
}

function h2s(hex) {
  var str = '';
  for (var i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }    
  return str;
}

 function syntaxHighlight(json) {
   if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
   }
   json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
   return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
       var cls = 'number';
       if (/^"/.test(match)) {
           if (/:$/.test(match)) {
               cls = 'key';
           } else {
               cls = 'value';
           }
       } else if (/true|false/.test(match)) {
           cls = 'boolean';
       } else if (/null/.test(match)) {
           cls = 'null';
       }
       return '<div class=' + cls + '>' + match + '</div>';
   });
}
