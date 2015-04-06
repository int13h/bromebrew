package main

import (
	"flag"
	"html/template"
	"log"
	"net/http"
)

const (
	Name = "bromebrew"
	Version = "0.1.0"
)

var (
	addr      = flag.String("addr", ":8080", "http service address")
	ssl_cert  = flag.String("ssl_cert", "/etc/ssl/local/cert.pem", "path to ssl cert")
	ssl_key   = flag.String("ssl_key", "/etc/ssl/local/key.pem", "path to ssl key")
	
	homeTempl *template.Template
)

func HomeHandler(c http.ResponseWriter, req *http.Request) {
	homeTempl.Execute(c, req.Host)
}

func main() {
	flag.Parse()
	
	homeTempl = template.Must(template.ParseFiles("./web/index.html"))
	h := NewHub()
	go h.run()
	
	http.Handle("/public/", http.FileServer(http.Dir("./web/")))
	
	http.HandleFunc("/", HomeHandler)
	http.Handle("/ws", WsHandler{h: h})
	
	if err := http.ListenAndServeTLS(*addr, *ssl_cert, *ssl_key, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
