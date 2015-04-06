package main

import (
    "fmt"
    "github.com/Activestate/tail"
    "strings"
    "encoding/json"
)

type Wrapper struct {
    Path string
    Header *BroHeader
    Tail bool
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

    t, err := tail.TailFile(self.Path, tail.Config{
		Follow: true,
		ReOpen: true,
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
        
        
	    for i, value := range values {
	        //fmt.Println(self.Header.Fields[i], value)
	        data[self.Header.Fields[i]] = value
	    }
	    
        json, _ := json.Marshal(data)
        fmt.Println(string(json))
	    
		//c.h.broadcast <- []byte(line.Text)
	}
}
