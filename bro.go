package main

import (
	"bufio"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"encoding/json"
	"io/ioutil"
	"path"
	"path/filepath"
)

// #separator \x09
// #set_separator  ,
// #empty_field  (empty)
// #unset_field  -
// #path conn
// #open 2015-04-06-18-00-11
// #fields ts  uid id.orig_h id.orig_p id.resp_h id.resp_p proto service duration  orig_bytes  resp_bytes  conn_state  local_orig  missed_bytes  history orig_pkts orig_ip_bytes resp_pkts resp_ip_bytes tunnel_parent
// #types  time  string  addr  port  addr  port  enum  string  interval  count count string  bool  count string  count count count count set[string]

type BroHeader struct {
	Name         string
	Separator    string
	SetSeparator string
	EmptyField   string
	UnsetField   string
	Timestamp    string
	Fields       []string
	Types        []string `json:"types"`
}

func (self *BroHeader) Json() string {

    jsonHeader, _ := json.Marshal(map[string]interface{}{
    	"type": "header",
    	"data": map[string]interface{}{
	        "fields": self.Fields,
    	},
    })
    
    return string(jsonHeader)
}

func BuildBroHeader(logPath string) (*BroHeader, error) {
	header := &BroHeader{}

	// Check if file exists
	if !IsExist(logPath) {
		return header, errors.New("File not found")
	}

	data, err := os.Open(logPath)

	defer data.Close()

	if err != nil {
		return header, err
	}

	scanner := bufio.NewReader(data)
	line, err := scanner.ReadString('\n')

	// Check for field separator
	if strings.HasPrefix(line, "#separator") {
		separator := strings.Trim(strings.Split(line, ` \x`)[1], "\n")

		if sep, err := hex.DecodeString(separator); err != nil {
			return header, err
		} else {
			header.Separator = string(sep)
		}

	} else {
		return header, errors.New("File is corrupt or not a valid Bro log")
	}

	// Build headers
	for {

		line, err = scanner.ReadString('\n')

		if err != nil {
			fmt.Println(err)
			break
		}

		if !strings.HasPrefix(line, "#") {
			break
		}

		row := strings.Split(strings.Trim(line, "\n"), header.Separator)

		field := row[:1][0]
		values := row[1:]

		switch field {
		case "#empty_field":
			header.EmptyField = values[0]
		case "#unset_field":
			header.UnsetField = values[0]
		case "#path":
			header.Name = values[0]
		case "#open":
			header.Timestamp = values[0]
		case "#fields":
			header.Fields = values
		case "#types":
			header.Types = values
		}
	}

	if len(header.Fields) != len(header.Types) {
		return header, errors.New("ERROR: Field and Types length mismatch")
	}

	return header, nil
}

func FindLogs(dirs []string) ([]*Wrapper, error) {
	
	// dir = [path/to/logs, logs/dir]
	// --> *.log
	
	// found file: conn.log
	// [].append("conn.log")
	// [conn.log];

	// ssl.log
	// [conn.log].append("ssl.log")
	// [conn.log, ssl.log]

	var logs []*Wrapper

	for _, dir := range dirs {
		// Check if file exists
		if !IsExist(dir) {
			continue
		}		
		
		p, _ := filepath.Abs(dir)
		
		files, _ := ioutil.ReadDir(p)
		
    	for _, f := range files {
    		name := f.Name()
    		
    		if !f.IsDir() && filepath.Ext(name) == ".log" {
    			
    			w := &Wrapper{
    				Path: path.Join(p, name),
    			}
    			
    			if err := w.Init(); err == nil {
	            	logs = append(logs, w)
    			}
    			
    		}
    	}
    	
    	
	}
	
	if len(logs) <= 1  {
		return logs, errors.New("No files found!")	
	}

	return logs, nil
	
}