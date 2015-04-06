package main

import (
	"fmt"
	"net/http"

	"github.com/Activestate/tail"
	"github.com/gorilla/websocket"
)

type connection struct {
	// The websocket connection.
	ws *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// The hub.
	h *hub
}

func (c *connection) reader() {
	for {
		_, message, err := c.ws.ReadMessage()
		if err != nil {
			break
		}
		c.h.broadcast <- message
	}
	c.ws.Close()
}

func (c *connection) writer() {
	for message := range c.send {
		err := c.ws.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			break
		}
	}
	c.ws.Close()
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
	h *hub
}

func (wsh WsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	c := &connection{send: make(chan []byte, 256), ws: ws, h: wsh.h}
	c.h.register <- c
	defer func() { c.h.unregister <- c }()
	go c.brolog()
	go c.writer()
	c.reader()
}
