NAME="bromebrew"

VERSION=$(shell cat $(NAME).go | grep -oP "Version\s+?\=\s?\"\K.*?(?=\"$|$\)")
CWD=$(shell pwd)

GITHUB_USER=int13h
CCOS=linux
CCARCH=386 amd64
CCOUTPUT="pkg/{{.OS}}-{{.Arch}}/$(NAME)"

NO_COLOR=\033[0m
OK_COLOR=\033[32;01m
ERROR_COLOR=\033[31;01m
WARN_COLOR=\033[33;01m

DEPS = $(go list -f '{{range .TestImports}}{{.}} {{end}}' ./...)
UNAME := $(shell uname -s)

ifeq ($(UNAME),Darwin)
	ECHO=echo
else
	ECHO=/bin/echo -e
endif

all:
	@mkdir -p bin/
	@$(ECHO) "$(OK_COLOR)==> Building $(NAME) $(VERSION) $(NO_COLOR)"
	@godep go build -o bin/$(NAME)
	@chmod +x bin/$(NAME)
	@$(ECHO) "$(OK_COLOR)==> Done$(NO_COLOR)"

deps:
	@$(ECHO) "$(OK_COLOR)==> Installing dependencies$(NO_COLOR)"
	@godep get

updatedeps:
	@$(ECHO) "$(OK_COLOR)==> Updating all dependencies$(NO_COLOR)"
	@go get -d -v -u ./...
	@echo $(DEPS) | xargs -n1 go get -d -u
	@godep update ...

test: deps
	@$(ECHO) "$(OK_COLOR)==> Testing $(NAME)...$(NO_COLOR)"
	go test ./...

clean:
	@$(ECHO) "$(OK_COLOR)==> Cleaning$(NO_COLOR)"
	@rm -rf bin/
	@rm -rf pkg/

install: clean all

uninstall: clean

tar: 

.PHONY: all clean deps