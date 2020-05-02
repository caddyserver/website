---
title: Advanced testing for your caddy server
---

Advanced Testing of Servers
=================

This guide deals with automated testing of your caddy configuration. This can helpful if you have complex routing logic or if you are building a caddy module and want a way to verify your code will run against a caddy server as part of your local development and CI/CD processes.

## Testing using Go

Caddy is written in Go, as are all of the plugins. Go also comes with built-in testing framework, we can leverage that to test our config and modules.

Here is a complete example. 

This test will:
  a) create a new tester
  b) load the configuration against an in memory Caddy server 
  c) then make a test request against the server.

```go
func TestRespond(t *testing.T) {

	// arrange
	tester := caddytest.NewTester(t)
	tester.InitServer(` 
  {
    http_port     9080
    https_port    9443
  }
  
  localhost:9080 {
    respond /version 200 {
      body "hello from localhost"
    }	
    }
  `, "caddyfile")

	// act and assert
	tester.AssertGetResponse("http://localhost:9080/version", 200, "hello from localhost")
}
```

As go users will know, you can run this test using this command (add `-v` for more details)

```sh
go test ./... -run TestRespond
```


## Testing against a live domain

Often it would be nice to test your configuration using a live site. With tls. Caddy can do that too, it is a pretty neat trick.

This test will:
  a) create a new tester
  b) load the configuration against an in memory Caddy server 
  c) generate local certificates via the SmallStep integration
  d) make an request to https://www.eff.com which will be re-routed to the test server

```go
func TestLiveRespond(t *testing.T) {

	// arrange
	tester := caddytest.NewTester(t)
	tester.InitServer(` 
  {
    local_certs
  }
  
  www.eff.org {
    
    respond /example 200 {
      body "hello from the eff (well not really)"
    }	
  }
  `, "caddyfile")

	// act and assert
	tester.AssertGetResponse("https://www.eff.org/example", 200, "hello from the eff (well not really)")
}
```

## Further documentation

There are many more testing features, including support for `PUT`, `POST`, `PATCH`, `DELETE` are documented here [caddytest](https://pkg.go.dev/github.com/caddyserver/caddy/v2@v2.0.0-test.4/caddytest?tab=doc)

