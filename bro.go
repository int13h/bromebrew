package main

// #separator \x09                                                                 
// #set_separator  ,     
// #empty_field  (empty)                                                                                                                                                                                              
// #unset_field  -     
// #path conn     
// #open 2015-04-06-18-00-11     
// #fields ts  uid id.orig_h id.orig_p id.resp_h id.resp_p proto service duration  orig_bytes  resp_bytes  conn_state  local_orig  missed_bytes  history orig_pkts orig_ip_bytes resp_pkts resp_ip_bytes tunnel_parent
// #types  time  string  addr  port  addr  port  enum  string  interval  count count string  bool  count string  count count count count set[string]

type BroHeader struct {
    Name            string
    Separator       string
    SetSeparator    string
    EmptyField      string
    UnsetField      string
    Timestamp       string
    Fields          []string
    FieldMap        map[string]string
}
