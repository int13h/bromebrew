package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Activestate/tail"
)

type Wrapper struct {
	Path   string
	Header *BroHeader
	Tail   bool
	Socket *connection
}

func (self *Wrapper) Init() error {
	header, err := BuildBroHeader(self.Path)

	if err != nil {
		return err
	}

	self.Header = header

	return nil
}

func (self *Wrapper) Watch() {

	headerJson := self.Header.Json()

	if self.Socket != nil {
		self.Socket.send <- []byte(headerJson)
	} else {
		fmt.Printf("DEBUG HEADER: %s\n", headerJson)
	}

	t, err := tail.TailFile(self.Path, tail.Config{
		Follow: false,
		ReOpen: false,
	})

	if err != nil {
		fmt.Println("ERROR: I could not open the file")
	}

	for line := range t.Lines {

		if strings.HasPrefix(line.Text, "#") {
			continue
		}

		values := strings.Split(line.Text, self.Header.Separator)

		data := map[string]interface{}{}
		event := map[string]interface{}{}

		data["type"] = "event"

		for i, value := range values {
			event[self.Header.Fields[i]] = value
		}

		data["data"] = event

		json, _ := json.Marshal(data)

		// send to requester
		if self.Socket != nil {
			self.Socket.send <- json
		} else {
			fmt.Printf("DEBUG: %s\n", json)
		}

		// send to everyone
		//self.Socket.h.broadcast <- json
	}
}
