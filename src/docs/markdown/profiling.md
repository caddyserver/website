---
title: Profiling Caddy
---

Profiling Caddy
================

A **program profile** is a snapshot of a program's use of resources at runtime. Profiles can be extremely helpful to identify problem areas, troubleshoot bugs and crashes, and optimize code.

Caddy uses Go's tooling for capturing profiles, which is called [pprof](https://github.com/google/pprof), and it is built into the `go` command.

Profiles report on consumers of CPU and memory, show stack traces of goroutines, and help track down deadlocks or high-contention synchronization primitives.

When reporting certain bugs in Caddy, we may ask for a profile. This article can help. It describes both how to obtain profiles with Caddy, and how to use and interpret the resulting pprof profiles in general.


Two things to know before getting started:

1. **Caddy profiles are NOT security-sensitive.** They contain benign technical readouts, not the contents of memory. They do not grant access to systems. They are safe to share.
2. **Profiles are lightweight and can be collected in production.** In fact, this is a recommended best practice for many users; see later in this article.

## Obtaining profiles

Profiles are available via the [admin interface](/docs/api) at `/debug/pprof/`. On a machine running Caddy, open it in your browser:

```
http://localhost:2019/debug/pprof/
```

<aside class="tip">
	By default, the admin API is only accessible locally. If running remotely, in VMs, or in containers, see the next section for how to access this endpoint.
</aside>

You'll notice a simple table of counts and links, such as:

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
|     | full goroutine stack dump

The counts are a handy way to quickly identify leaks. If you suspect a leak, refresh the page repeatedly and you'll see one or more of those counts constantly increasing. If the heap count grows, it's a possible memory leak; if the goroutine count grows, it's a possible goroutine leak.

Click through the profiles and see what they look like. Some may be empty and that's normal a lot of the time. The most commonly-used ones are <b>goroutine</b> (function stacks), <b>heap</b> (memory), and <b>profile</b> (CPU). Other profiles are useful for troubleshooting mutex contention or deadlocks.

At the bottom, there's a simple description of each profile:

- **allocs:** A sampling of all past memory allocations
- **block:** Stack traces that led to blocking on synchronization primitives
- **cmdline:** The command line invocation of the current program
- **goroutine:** Stack traces of all current goroutines. Use debug=2 as a query parameter to export in the same format as an unrecovered panic.
- **heap:** A sampling of memory allocations of live objects. You can specify the gc GET parameter to run GC before taking the heap sample.
- **mutex:** Stack traces of holders of contended mutexes
- **profile:** CPU profile. You can specify the duration in the seconds GET parameter. After you get the profile file, use the go tool pprof command to investigate the profile.
- **threadcreate:** Stack traces that led to the creation of new OS threads
- **trace:** A trace of execution of the current program. You can specify the duration in the seconds GET parameter. After you get the trace file, use the go tool trace command to investigate the trace.

<aside class="tip">

The difference between "goroutine" and "full goroutine stack dump" is the `?debug=2` parameter: the full stack dump is like output you'd see after a panic; it's more verbose and, notably, does not collapse identical goroutines.

</aside>


### Downloading profiles

Clicking the links on the pprof index page above will give you profiles in text format. This is useful for debugging, and it's what we on the Caddy team prefer because we can scan it to look for obvious clues without needing extra tooling.

But binary is actually the default format. The HTML links append the `?debug=` query string parameter to format them as text, except for the (CPU) "profile" link, which does not have a textual representation.

These are the query string parameters you can set (from [the Go docs](https://pkg.go.dev/net/http/pprof#hdr-Parameters)):

- **`debug=N` (all profiles except cpu):** response format: N = 0: binary (default), N > 0: plaintext
- **`gc=N` (heap profile):** N > 0: run a garbage collection cycle before profiling
- **`seconds=N` (allocs, block, goroutine, heap, mutex, threadcreate profiles):** return a delta profile
- **`seconds=N` (cpu, trace profiles):** profile for the given duration

Because these are HTTP endpoints, you can also use any HTTP client like curl or wget to download profiles.

Once your profiles are downloaded, you can upload them to a GitHub issue comment or use a site like [pprof.me](https://pprof.me/). For CPU profiles specifically, [flamegraph.com](https://flamegraph.com/) is another option.


## Accessing remotely

_If you're already able to access the admin API locally, skip this section._

By default, Caddy's admin API is only accessible over the loopback socket. However, there are at least 3 ways you can access Caddy's `/debug/pprof` endpoint remotely:

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

This tunnels `localhost:8123` (on your local machine) to `localhost:2019` on `example.com`. Make sure to replace `username`, `example.com`, and ports as necessary.

<aside class="tip">

This command will run in the foreground. Keep in mind that if you try to background the process with <kbd>Ctrl</kbd>+<kbd>Z</kbd>, it will pause the tunnel, and connections using the tunnel will fail to connect.

</aside>

Then in another terminal you can run `curl` like so:

<pre><code class="cmd bash">curl -v http://localhost:8123/debug/pprof/ -H "Host: localhost:2019"</code></pre>

You can avoid the need for `-H "Host: ..."` by using port `2019` on both sides of the tunnel (but this requires that port `2019` is not already taken on your own computer, i.e. not having Caddy running locally).

While the tunnel is active, you can access any and all of the admin API. Type <kbd>Ctrl</kbd>+<kbd>C</kbd> on the `ssh` command to close the tunnel.

#### Long-running tunnel

Running a tunnel with the above command requires that you keep the terminal open. If you want to run the tunnel in the background, you can start the tunnel like this:

<pre><code class="cmd bash">ssh -f -N -M -S /tmp/caddy-tunnel.sock username@example.com -L 8123:localhost:2019</code></pre>

This will start in the background and create a control socket at `/tmp/caddy-tunnel.sock`. You can then use the control socket to close the tunnel when you're done with it:

<pre><code class="cmd bash">ssh -S /tmp/caddy-tunnel.sock -O exit e</code></pre>


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

- **Duration:** How long the goroutine has existed. Useful for finding bugs like goroutine leaks. For example, if we expect all network connections to be closed after a few minutes, what does it mean when we find a lot of netconn goroutines alive for hours?

### Interpreting goroutine dumps

Without looking at code, what can we learn about the above goroutine?

It was created only about a minute ago, is waiting for data over a network socket, and its goroutine number is quite large (61961905).

From the first dump (debug=1), we know its call stack is executed relatively frequently, and the large goroutine number combined with the short duration suggests that there have been tens of millions of these relatively short-lived goroutines. It's in a function called `pollWait` and its call history includes reading HTTP/2 frames from an encrypted network connection that uses TLS.

So, we can deduce that this goroutine is serving an HTTP/2 request! It's waiting on data from the client. What's more, we know that the goroutine that spawned it is not one of the first goroutines of the process because it also has a high number; finding that goroutine in the dump reveals that it was spawned to handle a new HTTP/2 stream during an existing request. By contrast, other goroutines with high numbers may be spawned by a low-numbered goroutine (such as 32), indicating a brand new connection fresh off an `Accept()` call from the socket.

Every program is different, but when debugging Caddy, these patterns tend to hold true.

## Memory profiles

Memory (or heap) profiles track heap allocations, which are the major consumers of memory on a system. Allocations are also a usual suspect for performance problems because allocating memory requires system calls, which can be slow.

Heap profiles look similar to goroutine profiles in nearly every way except the start of the top line. Here's an example:

```
0: 0 [1: 4096] @ 0xb1fc05 0xb1fc4d 0x48d8d1 0xb1fce6 0xb184c7 0xb1bc8e 0xb41653 0xb4105c 0xb4151d 0xb23b14 0x4719c1
#	0xb1fc04	bufio.NewWriterSize+0x24					bufio/bufio.go:599
#	0xb1fc4c	golang.org/x/net/http2.glob..func8+0x6c				golang.org/x/net@v0.17.0/http2/http2.go:263
#	0x48d8d0	sync.(*Pool).Get+0xb0						sync/pool.go:151
#	0xb1fce5	golang.org/x/net/http2.(*bufferedWriter).Write+0x45		golang.org/x/net@v0.17.0/http2/http2.go:276
#	0xb184c6	golang.org/x/net/http2.(*Framer).endWrite+0xc6			golang.org/x/net@v0.17.0/http2/frame.go:371
#	0xb1bc8d	golang.org/x/net/http2.(*Framer).WriteHeaders+0x48d		golang.org/x/net@v0.17.0/http2/frame.go:1131
#	0xb41652	golang.org/x/net/http2.(*writeResHeaders).writeHeaderBlock+0xd2	golang.org/x/net@v0.17.0/http2/write.go:239
#	0xb4105b	golang.org/x/net/http2.splitHeaderBlock+0xbb			golang.org/x/net@v0.17.0/http2/write.go:169
#	0xb4151c	golang.org/x/net/http2.(*writeResHeaders).writeFrame+0x1dc	golang.org/x/net@v0.17.0/http2/write.go:234
#	0xb23b13	golang.org/x/net/http2.(*serverConn).writeFrameAsync+0x73	golang.org/x/net@v0.17.0/http2/server.go:851
```

The first line format is as follows:

```
<live objects> <live memory> [<allocations>: <allocation memory>] @ <addresses...>
```

In the example above, we have a single allocation made by `bufio.NewWriterSize()` but currently no live objects from this call stack.

Interestingly, we can infer from that call stack that the http2 package used a pooled 4 KB to write HTTP/2 frame(s) to the client. You'll often see pooled objects in Go memory profiles if hot paths have been optimized to reuse allocations. This reduces new allocations, and the heap profile can help you know if the pool is being used properly!

## CPU profiles

CPU profiles help you understand where the Go program is spending most of its scheduled time on the processor.

However, there is no plaintext form for these, so in the next section, we'll use `go tool pprof` commands to help us read them.

To download a CPU profile, make a request to `/debug/pprof/profile?seconds=N`, where N is the number of seconds over which you want to collect the profile. During CPU profile collection, program performance may be mildly impacted. (Other profiles have virtually no performance impact.)

When completed, it should download a binary file, aptly named `profile`. Then we need to examine it.

## `go tool pprof`

We'll use Go's built-in profile analyzer to read the CPU profile as an example, but you can use it with any kind of profile.

Run this command (replacing "profile" with the actual filepath if different), which opens an interactive prompt:

<pre><code class="cmd bash">go tool pprof profile
File: caddy_master
Type: cpu
Time: Aug 29, 2022 at 8:47pm (MDT)
Duration: 30.02s, Total samples = 70.11s (233.55%)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof) </code></pre>

<aside class="tip">

You can use this command to examine any type of profile, not just CPU profiles. The principles are the same for other profiles and the concepts carry over.

</aside>

This is something you can explore. Entering `help` gives you a list of commands and `o` will show you current options. And if you type `help <command>` you can get information about a specific command.

There's a lot of commands, but some common ones are:

- `top`: Show what used the most CPU. You can append a number like `top 20` to see more, or a regex to "focus" on or ignore certain items.
- `web`: Open the call graph in your web browser. This is a great way to visually see CPU usage.
- `svg`: Generate an SVG image of the call graph. It's the same as `web` except it doesn't open your web browser and the SVG is saved locally.
- `tree`: A tabular view of the call stack.

Let's start with `top`. We see output like:

```
(pprof) top
Showing nodes accounting for 38.36s, 54.71% of 70.11s total
Dropped 785 nodes (cum <= 0.35s)
Showing top 10 nodes out of 196
      flat  flat%   sum%        cum   cum%
    10.97s 15.65% 15.65%     10.97s 15.65%  runtime/internal/syscall.Syscall6
     6.59s  9.40% 25.05%     36.65s 52.27%  runtime.gcDrain
     5.03s  7.17% 32.22%      5.34s  7.62%  runtime.(*lfstack).pop (inline)
     3.69s  5.26% 37.48%     11.02s 15.72%  runtime.scanobject
     2.42s  3.45% 40.94%      2.42s  3.45%  runtime.(*lfstack).push
     2.26s  3.22% 44.16%      2.30s  3.28%  runtime.pageIndexOf (inline)
     2.11s  3.01% 47.17%      2.56s  3.65%  runtime.findObject
     2.03s  2.90% 50.06%      2.03s  2.90%  runtime.markBits.isMarked (inline)
     1.69s  2.41% 52.47%      1.69s  2.41%  runtime.memclrNoHeapPointers
     1.57s  2.24% 54.71%      1.57s  2.24%  runtime.epollwait
```

The top 10 consumers of the CPU were all in the Go runtime -- in particular, lots of garbage collection (remember that syscalls are used to free and allocate memory). This is a hint that we could reduce allocations to improve performance, and a heap profile would be worthwhile.

OK, but what if we want to see CPU utilization from our own code? We can ignore patterns containing "runtime" like so:

```
(pprof) top -runtime  
Active filters:
   ignore=runtime
Showing nodes accounting for 0.92s, 1.31% of 70.11s total
Dropped 160 nodes (cum <= 0.35s)
Showing top 10 nodes out of 243
      flat  flat%   sum%        cum   cum%
     0.17s  0.24%  0.24%      0.28s   0.4%  sync.(*Pool).getSlow
     0.11s  0.16%   0.4%      0.11s  0.16%  github.com/prometheus/client_golang/prometheus.(*histogram).observe (inline)
     0.10s  0.14%  0.54%      0.23s  0.33%  github.com/prometheus/client_golang/prometheus.(*MetricVec).hashLabels
     0.10s  0.14%  0.68%      0.12s  0.17%  net/textproto.CanonicalMIMEHeaderKey
     0.10s  0.14%  0.83%      0.10s  0.14%  sync.(*poolChain).popTail
     0.08s  0.11%  0.94%      0.26s  0.37%  github.com/prometheus/client_golang/prometheus.(*histogram).Observe
     0.07s   0.1%  1.04%      0.07s   0.1%  internal/poll.(*fdMutex).rwlock
     0.07s   0.1%  1.14%      0.10s  0.14%  path/filepath.Clean
     0.06s 0.086%  1.23%      0.06s 0.086%  context.value
     0.06s 0.086%  1.31%      0.06s 0.086%  go.uber.org/zap/buffer.(*Buffer).AppendByte
```

Well, it's clear that Prometheus metrics are another top consumer, but you'll notice that cumulatively, they amount to orders of magnitude less than GC above. The stark difference suggests that we should focus on reducing GC.

<aside class="tip">

It's important to note that CPU profiles get their measurements from intermittent sampling, and samples will never be captured more frequently than the sampling rate, which is 10ms by default. That's why you won't see any cumulative time durations that are less than 10ms (they are likely less, but rounded up). For more specific timings, you can do an execution trace, which does not use sampling. (TODO: Add section about tracing.)

</aside>

Let's use `q` to quit this profile and use the same command on the heap profile:

```
(pprof) top
Showing nodes accounting for 22259.07kB, 81.30% of 27380.04kB total
Showing top 10 nodes out of 102
      flat  flat%   sum%        cum   cum%
   12300kB 44.92% 44.92%    12300kB 44.92%  runtime.allocm
 2570.01kB  9.39% 54.31%  2570.01kB  9.39%  bufio.NewReaderSize
 2048.81kB  7.48% 61.79%  2048.81kB  7.48%  runtime.malg
 1542.01kB  5.63% 67.42%  1542.01kB  5.63%  bufio.NewWriterSize
 ...
 ```

Bingo. Nearly half of memory is allocated strictly for read and write buffers from our use of the bufio package. Thus, we can infer that optimizing our code to reduce buffering would be very beneficial. (The [associated patch in Caddy](https://github.com/caddyserver/caddy/pull/4978) does just that).

### Visualizations

If we instead run the `svg` or `web` commands, we'll get a visualization of the profile:

![CPU profile visualization](/old/resources/images/profile.png)

This is a CPU profile but similar graphs are available for other profile types.

To learn how to read these graphs, read [the pprof documentation](https://github.com/google/pprof/blob/main/doc/README.md#interpreting-the-callgraph).


### Diffing profiles

After you make a code change, you can compare the before and after using a difference analysis ("diff"). Here's a diff of the heap:

<pre><code class="cmd bash">go tool pprof -diff_base=before.prof after.prof
File: caddy
Type: inuse_space
Time: Aug 29, 2022 at 1:21am (MDT)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof) top
Showing nodes accounting for -26.97MB, 49.32% of 54.68MB total
Dropped 10 nodes (cum <= 0.27MB)
Showing top 10 nodes out of 137
      flat  flat%   sum%        cum   cum%
  -27.04MB 49.45% 49.45%   -27.04MB 49.45%  bufio.NewWriterSize
      -2MB  3.66% 53.11%       -2MB  3.66%  runtime.allocm
    1.06MB  1.93% 51.18%     1.06MB  1.93%  github.com/yuin/goldmark/util.init
    1.03MB  1.89% 49.29%     1.03MB  1.89%  github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy.glob..func2
       1MB  1.84% 47.46%        1MB  1.84%  bufio.NewReaderSize
      -1MB  1.83% 49.29%       -1MB  1.83%  runtime.malg
       1MB  1.83% 47.46%        1MB  1.83%  github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy.cloneRequest
      -1MB  1.83% 49.29%       -1MB  1.83%  net/http.(*Server).newConn
   -0.55MB  1.00% 50.29%    -0.55MB  1.00%  html.populateMaps
    0.53MB  0.97% 49.32%     0.53MB  0.97%  github.com/alecthomas/chroma.TypeRemappingLexer</code></pre>

As you can see, we reduced memory allocations by about half!

Diffs can be visualized, too:

![CPU profile visualization](/old/resources/images/profile-diff.png)

This makes it really obvious how the changes affected the performance of certain parts of the program.

## Further reading

There's a lot to master with program profiling, and we've only scratched the surface.

To really put the "pro" in "profiling", consider these resources:

- [pprof Documentation](https://github.com/google/pprof/blob/main/doc/README.md)
- [A real-world use of profiles with Caddy](https://github.com/caddyserver/caddy/pull/4978)
- [Performance on the Go wiki](https://github.com/golang/go/wiki/Performance)
- [The `net/http/pprof` package](https://pkg.go.dev/net/http/pprof)
