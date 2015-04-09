package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"errors"
	"path/filepath"

	"github.com/Activestate/tail"
	"github.com/gorilla/websocket"
)

type connection struct {
	// The websocket connection.
	ws *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// The hub.
	h *Hub
}

func (self *connection) reader() {

	fmt.Println("BEFORE READ!")

	for {
		_, message, err := self.ws.ReadMessage()
		if err != nil {
			fmt.Println(err)
			break
		}
		//c.h.broadcast <- message

		if wrapper, err := FindLogByName(string(message)); err == nil {
			go wrapper.Watch()
		}
		// self.ReadLog(string(message))
	}

	fmt.Println("AFTER READ")

	self.ws.Close()
}

func (c *connection) writer() {
	for message := range c.send {
		err := c.ws.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			break
		}
	}
	// c.ws.Close()
}

func (c *connection) brolog() {

	const cl_path string = "/var/nsm/bro/logs/current/conn.log"

	t, err := tail.TailFile(cl_path, tail.Config{
		Follow: true,
		ReOpen: true,
	})

	if err != nil {
		fmt.Println("ERROR: I could not open the file")
	}

	for line := range t.Lines {
		c.h.broadcast <- []byte(line.Text)
	}
}

var upgrader = &websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024}

type WsHandler struct {
	h *Hub
}

func (wsh WsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	c := &connection{send: make(chan []byte, 256), ws: ws, h: wsh.h}
	c.h.register <- c
	defer func() { c.h.unregister <- c }()

	// available logs
	var loglist bytes.Buffer

	for _, log := range Logs {
		fmt.Println("Processing Log File: ", log.Path)
		log.Socket = c
		loglist.WriteString(filepath.Base(log.Path) + "||")
	}

	json, _ := json.Marshal(map[string]interface{}{
		"type": "loglist",
		"data": strings.TrimSuffix(loglist.String(), "||"),
	})

	// send list to client
	c.send <- json

	go c.writer()
	c.reader()
}

func FindLogByName(name string) (*Wrapper, error) {

	for _, log := range Logs {
		base := filepath.Base(log.Path)

		if name == base {
			return log, nil
		}
	}

	return nil, errors.New("Log Not Found.")
}
