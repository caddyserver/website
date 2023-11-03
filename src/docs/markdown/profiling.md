---
title: Profiling Caddy
---

Profiling Caddy
================

A **program profile** is a snapshot of a program's use of resources at runtime. Profiles can be extremely helpful to identify problem areas, troubleshoot bugs and crashes, and optimize code.

Caddy uses Go's facilities for capturing profiles, which are compatible with the [pprof](https://github.com/google/pprof) tool, which is built into the `go` command.

Profiles report on consumers of CPU and memory, show stack traces of goroutines, and help trace down deadlocks or high-contention synchronization primitives.

When reporting certain bugs in Caddy, we may ask for a profile. This article can help. It describes both how to obtain profiles with Caddy,and how to use and interpret the resulting pprof profiles in general.


Two things to know before getting started:

1. **Caddy profiles are NOT security-sensitive.** They contain benign technical readouts, not the contents of memory. They cannot enable hackers to have access to your system. They are safe to share.
2. **Profiles are lightweight and can be collected in production.** In fact, this is a recommended best practice for many users; see later in this article.

## Obtaining profiles

Profiles are available via the [admin interface](/docs/api) at `/debug/pprof/`. On a machine running Caddy, open it in your browser:

```
http://localhost:2019/debug/pprof/
```

<aside class="tip">
	By default, the admin API is only accessible locally. If running remotely, in VMs, or in containers, see the next section for how to access this endpoint.
</aside>

You will see a simple list of profiles available along with their descriptions:

> - **allocs:** A sampling of all past memory allocations
> - **block:** Stack traces that led to blocking on synchronization primitives
> - **cmdline:** The command line invocation of the current program
> - **goroutine:** Stack traces of all current goroutines. Use debug=2 as a query parameter to export in the same format as an unrecovered panic.
> - **heap:** A sampling of memory allocations of live objects. You can specify the gc GET parameter to run GC before taking the heap sample.
> - **mutex:** Stack traces of holders of contended mutexes
> - **profile:** CPU profile. You can specify the duration in the seconds GET parameter. After you get the profile file, use the go tool pprof command to investigate the profile.
> - **threadcreate:** Stack traces that led to the creation of new OS threads
> - **trace:** A trace of execution of the current program. You can specify the duration in the seconds GET parameter. After you get the trace file, use the go tool trace command to investigate the trace.

Above these descriptions, you'll notice a simple table of counts and links, such as:

Count | Profile
----- | --------------------
79    | allocs
0     | block
0     | cmdline
22    | goroutine
79    | heap
0     | mutex
0     | profile
29    | threadcreate
0     | trace
full goroutine stack dump

The counts are a handy way to quickly identify leaks. If you suspect a leak, refresh the page repeatedly and you'll see one or more of those counts constantly increasing. If the heap count grows, it's a possible memory leak; if the goroutine count grows, it's a possible goroutine leak.

Click through the profiles and see what they look like. Some may be empty and that's normal a lot of the time. The most commonly-used ones are <b>goroutine</b> (function stacks), <b>heap</b> (memory), and <b>profile</b> (CPU). Other profiles are useful for troubleshooting mutex contention or deadlocks.

<aside class="tip">

The difference between "goroutine" and "full goroutine stack dump" is the `?debug=2` parameter: the full stack dump is like what you'd see output after a panic; it's more verbose and, notably, does not collapse identical goroutines.

</aside>


### Downloading profiles

Clicking the links on the pprof index page above will give you profiles in text format. This is useful for debugging, and it's what we on the Caddy team prefer because we can scan it to look for obvious clues without needing extra tooling.

But binary is actually the default format. The HTML links append the `?debug=` query string parameter to format them as text.

These are the query string parameters you can set (from [the Go docs](https://pkg.go.dev/net/http/pprof#hdr-Parameters)):

- **`debug=N` (all profiles):** response format: N = 0: binary (default), N > 0: plaintext
- **`gc=N` (heap profile):** N > 0: run a garbage collection cycle before profiling
- **`seconds=N` (allocs, block, goroutine, heap, mutex, threadcreate profiles):** return a delta profile
- **`seconds=N` (cpu, trace profiles):** profile for the given duration

Because these are HTTP endpoints, you can also use any HTTP client like curl or wget to download profiles.

Once your profiles are downloaded, you can upload them to a GitHub issue comment or use a site like [pprof.me](https://pprof.me/). For CPU profiles specifically, [flamegraph.com](https://flamegraph.com/) is another option.


## Accessing remotely

_If you're already able to access the admin API locally, skip this section._

By default, Caddy's admin API is only accessible over the loopback socket. However, there are at least 3 ways you can access Caddy's /debug/pprof endpoint remotely:

### Reverse proxy through your site

One easy option is to simply reverse proxy to it from your site:

```caddy-d
reverse_proxy /debug/pprof/* localhost:2019 {
	header_up Host {upstream_hostport}
}
```

This will, of course, make profiles available to who can connect to your site. If that's not desired, you can add some authentication using an HTTP auth module of your choice.

(Don't forget the `/debug/pprof/*` matcher, otherwise you'll proxy the entire admin API!)

### SSH tunnel

Another way is to use an SSH tunnel. This is an encrypted connection using the SSH protocol between your computer and your server. Run a command like this on your computer:

<pre><code class="cmd bash">ssh -N username@example.com -L 8123:localhost:2019</code></pre>

This tunnels `localhost:8123` to `example.com:2019`. Make sure to replace `username`, `example.com`, and ports as necessary.

Then in another terminal you can run `curl` like so:

<pre><code class="cmd bash">curl -v http://localhost:8123/debug/pprof/ -H "Host: localhost:2019"</code></pre>

You can avoid the need for `-H "Host: ..."` by using port 2019 on both sides of the tunnel (but this requires that port 2019 is not already taken on your own computer).

While the tunnel is active, you can access any and all of the admin API. Type <kbd>Ctrl</kbd>+<kbd>C</kbd> on the `ssh` command to close the tunnel.

### Remote admin API

You can also configure the admin API to accept remote connections to authorized clients.

(TODO: Write article about this.)



## Goroutine profiles

The goroutine dump is useful for knowing what goroutines exist and what their call stacks are. In other words, it give us an idea of code that is either currently executing or is blocking/waiting.

If you click "goroutines" or go to `/debug/pprof/goroutine?debug=1`, you'll see a list of goroutines and their call stacks. For example:

```
goroutine profile: total 88
23 @ 0x43e50e 0x436d37 0x46bda5 0x4e1327 0x4e261a 0x4e2608 0x545a65 0x5590c5 0x6b2e9b 0x50ddb8 0x6b307e 0x6b0650 0x6b6918 0x6b6921 0x4b8570 0xb11a05 0xb119d4 0xb12145 0xb1d087 0x4719c1
#	0x46bda4	internal/poll.runtime_pollWait+0x84			runtime/netpoll.go:343
#	0x4e1326	internal/poll.(*pollDesc).wait+0x26			internal/poll/fd_poll_runtime.go:84
#	0x4e2619	internal/poll.(*pollDesc).waitRead+0x279		internal/poll/fd_poll_runtime.go:89
#	0x4e2607	internal/poll.(*FD).Read+0x267				internal/poll/fd_unix.go:164
#	0x545a64	net.(*netFD).Read+0x24					net/fd_posix.go:55
#	0x5590c4	net.(*conn).Read+0x44					net/net.go:179
#	0x6b2e9a	crypto/tls.(*atLeastReader).Read+0x3a			crypto/tls/conn.go:805
#	0x50ddb7	bytes.(*Buffer).ReadFrom+0x97				bytes/buffer.go:211
#	0x6b307d	crypto/tls.(*Conn).readFromUntil+0xdd			crypto/tls/conn.go:827
#	0x6b064f	crypto/tls.(*Conn).readRecordOrCCS+0x24f		crypto/tls/conn.go:625
#	0x6b6917	crypto/tls.(*Conn).readRecord+0x157			crypto/tls/conn.go:587
#	0x6b6920	crypto/tls.(*Conn).Read+0x160				crypto/tls/conn.go:1369
#	0x4b856f	io.ReadAtLeast+0x8f					io/io.go:335
#	0xb11a04	io.ReadFull+0x64					io/io.go:354
#	0xb119d3	golang.org/x/net/http2.readFrameHeader+0x33		golang.org/x/net@v0.14.0/http2/frame.go:237
#	0xb12144	golang.org/x/net/http2.(*Framer).ReadFrame+0x84		golang.org/x/net@v0.14.0/http2/frame.go:498
#	0xb1d086	golang.org/x/net/http2.(*serverConn).readFrames+0x86	golang.org/x/net@v0.14.0/http2/server.go:818

1 @ 0x43e50e 0x44e286 0xafeeb3 0xb0af86 0x5c29fc 0x5c3225 0xb0365b 0xb03650 0x15cb6af 0x43e09b 0x4719c1
#	0xafeeb2	github.com/caddyserver/caddy/v2/cmd.cmdRun+0xcd2					github.com/caddyserver/caddy/v2@v2.7.4/cmd/commandfuncs.go:277
#	0xb0af85	github.com/caddyserver/caddy/v2/cmd.init.1.func2.WrapCommandFuncForCobra.func1+0x25	github.com/caddyserver/caddy/v2@v2.7.4/cmd/cobra.go:126
#	0x5c29fb	github.com/spf13/cobra.(*Command).execute+0x87b						github.com/spf13/cobra@v1.7.0/command.go:940
#	0x5c3224	github.com/spf13/cobra.(*Command).ExecuteC+0x3a4					github.com/spf13/cobra@v1.7.0/command.go:1068
#	0xb0365a	github.com/spf13/cobra.(*Command).Execute+0x5a						github.com/spf13/cobra@v1.7.0/command.go:992
#	0xb0364f	github.com/caddyserver/caddy/v2/cmd.Main+0x4f						github.com/caddyserver/caddy/v2@v2.7.4/cmd/main.go:65
#	0x15cb6ae	main.main+0xe										caddy/main.go:11
#	0x43e09a	runtime.main+0x2ba									runtime/proc.go:267

1 @ 0x43e50e 0x44e9c5 0x8ec085 0x4719c1
#	0x8ec084	github.com/caddyserver/certmagic.(*Cache).maintainAssets+0x304	github.com/caddyserver/certmagic@v0.19.2/maintain.go:67

...
```

The first line, `goroutine profile: total 88`, tells us what we're looking at and how many goroutines there are.

The list of goroutines follows. They are grouped by their call stacks in descending order of frequency.

A goroutine line has this syntax: `<count> @ <addresses...>`

The line starts with a count of the goroutines that have the associated call stack. The `@` symbol indicates the start of the call instruction addresses, i.e. the function pointers, that originated the goroutine. Each pointer is a function call, or call frame.

You may notice that many of your goroutines share the same first call address. This is your program's main, or entry point. Some goroutines won't originate there because programs have various `init()` functions and the Go runtime may also spawn goroutines.

The lines that follow start with `#` and are actually just comments for the benefit of the reader. They contain the current stack trace of the goroutine. The top represents the top of the stack, i.e. the current line of code being executed. The bottom represents the bottom of the stack, or the code that the goroutine initially started running.

The stack trace has this format:

```
<address> <package/func>+<offset> <filename>:<line>
```

The address is the function pointer, then you'll see the Go package and function name (with the associated type name if it's a method), and the instruction offset within the function. Then perhaps the most useful piece of info, the file and line number, are at the end.

### Full goroutine stack dump

If we change the query string parameter to `?debug=2`, we get a full dump. This includes a verbose stack trace of every goroutine, and identical goroutines are not collapsed. This output can be very large on busy servers, but it's interesting information!

Let's look at one that corresponds to the first call stack above (truncated):

```
goroutine 61961905 [IO wait, 1 minutes]:
internal/poll.runtime_pollWait(0x7f9a9a059eb0, 0x72)
	runtime/netpoll.go:343 +0x85
...
golang.org/x/net/http2.(*serverConn).readFrames(0xc001756f00)
	golang.org/x/net@v0.14.0/http2/server.go:818 +0x87
created by golang.org/x/net/http2.(*serverConn).serve in goroutine 61961902
	golang.org/x/net@v0.14.0/http2/server.go:930 +0x56a
```

Despite its verbosity, the most useful information uniquely provided by this dump are the first and last lines for every goroutine.

The first line contains the goroutine's number (61961905), state ("IO wait"), and duration ("1 minutes"):

- **Goroutine number:** Yes, goroutines have numbers! But they are not exposed to our code. These numbers are especially helpful in a stack trace, however, because we can see which goroutine spawned this one (see at the end: "created by ... in goroutine 61961902"). Tooling shown below helps us draw visual graphs of this.

- **State:** This tells us what the goroutine is currently doing. Here are some possible states you may see:
	- `running`: Executing code - awesome!
	- `IO wait`: Waiting for network. Does not consume an OS thread because it is parked on a non-blocking network poller.
	- `sleep`: We all need more of it.
	- `select`: Blocked on a select; waiting for a case to become available.
	- `select (no cases):` Blocked on an empty select `select {}` specifically. Caddy uses one in its main to keep running because shutdowns are initiated from other goroutines.
	- `chan receive`: Blocked on a channel receive (`<-ch`).
	- `semacquire`: Waiting to acquire a semaphore (low-level synchronization primitive).
	- `syscall`: Executing a system call. Consumes an OS thread.

- **Duration:** How long the goroutine has existed. Useful for finding bugs like goroutine leaks. For example, if we expect all network connections to be closed after a few minutes, what does it mean when we find a lot of goroutines alive for hours?

### Interpreting goroutine dumps

Without looking at code, what can we learn about the above goroutine?

It was created only about a minute ago, is waiting for data over a network socket, and its goroutine number is quite large (61961905).

From the first dump (debug=1), we know its call stack is executed relatively frequently, and the large goroutine number combined with the short duration suggests that there have been tens of millions of these relatively short-lived goroutines. It's in a function called `pollWait` and its call history includes reading HTTP/2 frames from an encrypted network connection that uses TLS.

So, we can deduce that this goroutine is serving an HTTP/2 request! It's waiting on data from the client. What's more, we know that the goroutine that spawned it is not one of the first goroutines of the process because it also has a high number; finding that goroutine in the dump reveals that it was spawned to handle a new HTTP/2 stream during an existing request. By contrast, other goroutines with high numbers may be spawned by a low-numbered goroutine (such as 32), indicating a brand new connection fresh off an `Accept()` call from the socket.

Every program is different, but when debugging Caddy, these patterns tend to hold true.

## Memory profiles