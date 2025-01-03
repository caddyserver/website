---
title: Architecture
---

Architecture
============

Caddy is a single, self-contained, static binary with zero external dependencies because it's written in Go. These values comprise important parts of the project's vision because they simplify deployment and reduce tedious troubleshooting in production environments.

If there's no dynamic linking, then how can it be extended? Caddy sports a novel plugin architecture that expands its capabilities far beyond that of any other web server, even those with external (dynamically-linked) dependencies.

Our philosophy of "fewer moving parts" ultimately results in more reliable, more manageable, less expensive sites&mdash;especially at scale. This semi-technical document describes how we achieve that goal through software engineering.


## Overview

Caddy consists of a command, core library, and modules.

The **command** provides the [command line interface](/docs/command-line) you are hopefully familiar with. It's how you launch the process from your operating system. The amount of code and logic here is fairly minimal, and has only what is needed to bootstrap the core in the user's desired way. We intentionally avoid using flags and environment variables for configuration except as they pertain to bootstrapping config.


<aside class="tip">

Modules can add subcommands to the command line interface! For instance, that's where the [`caddy file-server`](/docs/command-line#caddy-file-server) command comes from. These added commands may have any flags or use any environment variables they want, even though the core Caddy commands minimize their use.

</aside>


The **[core library](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc)**, or "core" of Caddy, primarily manages configuration. It can [`Run()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Run) a new configuration or [`Stop()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Stop) a running config. It also provides various utilities, types, and values for modules to use.

**Modules** do everything else. Many modules come built into Caddy, which are called the _standard modules_. These are determined to be the most useful to the most users.


<aside class="tip">

Sometimes the terms *module*, *plugin*, and *extension* get used interchangeably, and usually that's OK. Technically, all modules are plugins, but not all plugins are modules. Modules are specifically a kind of plugin that extends Caddy's [config structure](/docs/json/).

</aside>




## Caddy core

At its core, Caddy merely loads an initial configuration ("config") or, if there isn't one, opens a socket to accept new configuration later on.

A [Caddy configuration](/docs/json/) is a JSON document, with some fields at its top level:

```json
{
	"admin": {},
	"logging": {},
	"apps": {•••},
	...
}
```

The core of Caddy knows how to work with some of these fields natively: 

- [`admin`](/docs/json/admin/) so it can set up the [admin API](/docs/api) and manage the process
- [`logging`](/docs/json/logging/) so it can [emit logs](/docs/logging)

But other top-level fields (like [`apps`](/docs/json/apps/)) are opaque to the core of Caddy. In fact, all Caddy knows to do with the bytes in `apps` is deserialize them into an interface type that it can call two methods on:

1. `Start()`
2. `Stop()`

... and that's it. It calls `Start()` on each app when a config is loaded, and `Stop()` on each app when a config is unloaded.

When an app module is started, it initiates the app's module lifecycle.


<aside class="tip">

If you are a programmer who is building Caddy modules, you can find analogous information in our [Extending Caddy](/docs/extending-caddy) guide, but with more focus on code.

</aside>


## Module lifecycle

There are two kinds of modules: _host modules_ and _guest modules_.

**Host modules** (or "parent" modules) are those that load other modules.

**Guest modules** (or "child" modules) are those that get loaded. All modules are guest modules -- even app modules.

Modules get loaded, are provisioned and validated, get used, then are cleaned up, in this sequence:

1. Loaded
2. Provisioned and validated
3. Used
4. Cleaned up

Caddy kicks off the module lifecycle when a config is loaded first by initializing all the configured app modules. From there, it's turtles all the way down as each app module takes it the rest of the way.

### Load phase

Loading a module involves deserializing its JSON bytes into a typed value in memory. That's... basically it. It's just decoding JSON into a value.

### Provision phase

This phase is where most of the setup work goes. All modules get a chance to provision themselves after being loaded.

Since any properties from the JSON encoding will already have been decoded, only additional setup needs to take place here. The most common task during provisioning is setting up guest modules. In other words, provisioning a host module also results in provisioning its guest modules, all the way down.

You can get a sense for this by [traversing Caddy's JSON structure in our docs](/docs/json/). Anywhere you see `{•••}` is where guest modules may be used; and as you click into one, you can continue exploring all the way down until there are no more guest modules.

Other common provisioning tasks are setting up internal values that will be used during the module's lifetime, or standardizing inputs. For example, the [`http.matchers.remote_ip`](/docs/modules/http.matchers.remote_ip) module uses the provisioning phase to parse CIDR values out of the string inputs it received from the JSON. That way, it doesn't have to do this during every HTTP request, and is more efficient as a result.

Validation also can take place in the provision phase. If a module's resulting config is invalid, an error can be returned here which aborts the entire config load process.

### Use phase

Once a guest module is provisioned and validated, it can be used by its host module. What exactly this means is up to each host module.

Each module has an ID, which consists of a namespace and a name in that namespace. For example, [`http.handlers.reverse_proxy`](/docs/modules/http.handlers.reverse_proxy) is an HTTP handler because it is in the `http.handlers` namespace, and its name is `reverse_proxy`. All modules in the `http.handlers` namespace satisfy the same interface, known to the host module. Thus, the `http` app knows how to load and use these kinds of modules.

### Cleanup phase

When it is time for a config to be stopped, all modules get unloaded. If a module allocated any resources that should be freed, it has an opportunity to do so in the cleanup phase.


## Plugging in

A module -- or any Caddy plugin -- gets "plugged in" to Caddy by adding an `import` for the module's package. By importing the package, [the module registers itself](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#RegisterModule) with the Caddy core, so when the Caddy process starts, it knows each module by name. It can even associate between module values and names, and vice-versa.


<aside class="tip">

Plugins can be added without modifying the Caddy code base at all. There are instructions [in the readme](https://github.com/caddyserver/caddy/#with-version-information-andor-plugins) for doing this!

</aside>


## Managing configuration

Changing a running server's active configuration (often called a "reload") can be tricky with the high levels of concurrency and thousands of parameters that servers require. Caddy solves this problem elegantly using a design that has many benefits:

- No interruption to running services
- Granular config changes are possible
- Only one lock required (in the background)
- All reloads are atomic, consistent, isolated, and mostly durable ("ACID")
- Minimal global state

You can [watch a video about the design of Caddy 2 here](https://www.youtube.com/watch?v=EhJO8giOqQs).

A config reload works by provisioning the new modules, and if all succeed, the old ones are cleaned up. For a brief period, two configs are operational at the same time.

Each configuration is associated with a [context](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Context) which holds all the module state, so most state never escapes the scope of a config. This is good news for correctness, performance, and simplicity!

However, sometimes truly global state is necessary. For example, the reverse proxy may keep track of the health of its upstreams; since there is only one of each upstream globally, it would be bad if it forgot about them every time a minor config change was made. Fortunately, Caddy [provides facilities](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#UsagePool) similar to a language runtime's garbage collector to keep global state tidy.

One obvious approach to on-line config updates is to synchronize access to every single config parameter, even in hot paths. This is unbelievably bad in terms of performance and complexity&mdash;especially at scale&mdash;so Caddy does not use this approach.

Instead, configs are treated as immutable, atomic units: either the whole thing is replaced, or nothing gets changed. The [admin API endpoints](/docs/api)&mdash;which permit granular changes by traversing into the structure&mdash;mutate only an in-memory representation of the config, from which a whole new config document is generated and loaded. This approach has vast benefits in terms of simplicity, performance, and consistency. Since there is only one lock, it is easy for Caddy to process rapid reloads.

