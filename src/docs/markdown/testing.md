---
title: How to test your caddy server
---

Testing Servers
=================

Before releasing your web server to production you will want test it. Here is a quick guide to testing Caddy locally including support for HTTPS certificates.

## Testing using CURL

Lets start with a simple caddyfile. This will start a server on port `9080` which means it should run on your system without elevated permissions.

```Caddyfile
http://localhost:9080 {
    respond / 200 {
        body "hello from caddy"
    }
}
```

### Basic testing with curl

The most basic testing you can do with curl is simply make a `Get` request.

```sh
curl http://localhost:9080

> hello from caddy
```

For a little more information add `-i`. This becomes handy when testing things like `redirects`.

```sh
curl -i http://localhost:9080

> HTTP/1.1 200 OK
> Server: Caddy
> Date: Sat, 04 Apr 2020 20:31:32 GMT
> Content-Length: 20
>
> hello from localhost
```

#### Testing a redirect

Lets update our server to include a redirect from an old page `moved` to a new one `overhere`.

```Caddyfile
http://localhost:9080 {

    redir /moved /overhere 301
    
    respond / 200 {
        body "hello from caddy"
    }

    respond /overhere 200 {
        body "hello from over here"
    }
}
```

Lets try curling the moved page and log the response.

```sh
curl -i http://localhost:9080/moved

> HTTP/1.1 301 Moved Permanently
> Location: /overhere
> Server: Caddy
> Date: Sat, 04 Apr 2020 20:46:15 GMT
> Content-Length: 0
```

Note the `HTTP/1.1 301 Moved Permanently` is a different http status code and the `Location: /overhere`. Curl didn't actually follow the redirect like a webrowser would.

To tell curl to act like a webbrowser requires another option `-L`.

```sh
curl -i -L http://localhost:9080/moved

> HTTP/1.1 301 Moved Permanently
> Location: /overhere
> Server: Caddy
> Date: Sat, 04 Apr 2020 20:51:00 GMT
> Content-Length: 0

> HTTP/1.1 200 OK
> Server: Caddy
> Date: Sat, 04 Apr 2020 20:51:00 GMT
> Content-Length: 20

> hello from over here
```

Note here that curl makes 2 requests, the first to the `/moved` page and then it follows the redirect to `/overhere` and finally returns the text `hello from over here`.

### Basic testing with curl over TLS locally

Caddy makes it super simple to create a webserver with HTTPS support.

```Caddyfile
localhost {
    respond / 200 {
        body "hello from caddy"
    }
}
```

Lets test using `https`

```sh
curl -i https://localhost

HTTP/2 200 
server: Caddy
content-length: 16
date: Sat, 02 May 2020 07:21:48 GMT

hello from caddy
```

Using the same Caddyfile above, lets test another "secure by default" feature, automatic http -> https redirection.

```sh
curl -i http://localhost

HTTP/1.1 308 Permanent Redirect
Connection: close
Location: https://localhost/
Server: Caddy
Date: Sat, 02 May 2020 07:24:49 GMT
Content-Length: 0
```

Notice that Caddy will assume that TLS is expected and create an automatic redirection to `Location: https://localhost/`. Cool huh.






