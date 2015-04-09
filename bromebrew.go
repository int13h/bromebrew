package main

import (
	"fmt"
	"gopkg.in/alecthomas/kingpin.v1"
	"html/template"
	"log"
	"net/http"
	"os"
)

const (
	Name    = "bromebrew"
	Version = "0.1.0"
)

var (
	addr      = kingpin.Flag("addr", "http service address").Default(":8080").String()
	sslCert   = kingpin.Flag("sslCert", "path to ssl cert").Default("/etc/ssl/cert.pem").String()
	sslKey    = kingpin.Flag("sslKey", "path to ssl key").Default("/etc/ssl/key.pem").String()
	BaseDirs  = kingpin.Flag("dir", "path to base directories (multiple --dir allowed)").Required().Strings()
	homeTempl *template.Template

	Logs []*Wrapper
)

func HomeHandler(c http.ResponseWriter, req *http.Request) {
	homeTempl.Execute(c, req.Host)
}

func main() {
	kingpin.Parse()

	fmt.Println(*BaseDirs)
	logs, err := FindLogs(*BaseDirs)

	if err != nil {
		fmt.Println(err)
		os.Exit(-1)
	}

	Logs = logs

	h := NewHub()
	go h.run()

	homeTempl = template.Must(template.ParseFiles("./web/index.html"))

	http.Handle("/public/", http.FileServer(http.Dir("./web/")))

	http.HandleFunc("/", HomeHandler)
	http.Handle("/ws", WsHandler{h: h})

	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}

	//if err := http.ListenAndServeTLS(*addr, *sslCert, *sslKey, nil); err != nil {
	//	log.Fatal("ListenAndServe:", err)
	//}

}
