---
title: Monitoring Caddy with Prometheus metrics
---

# Monitoring Caddy with Prometheus metrics

Whether you're running thousands of Caddy instances in the cloud, or a single
Caddy server on an embedded device, it's likely that at some point you'll want
to have a high-level overview of what Caddy is doing, and how long it's taking.
In other words, you're going to want to be able to _monitor_ Caddy.

## Enabling metrics

You'll need to turn metrics on.

If using a Caddyfile, enable metrics [in global options](/docs/caddyfile/options#metrics):

```caddy
{
	metrics
}
```

If using JSON, add `"metrics": {}` to your [`apps > http > servers` configuration](/docs/json/apps/http/servers/).

To add per-host metrics you can insert the `per_host` option. Host specific metrics will now have a Host tag.

```caddy
{
	metrics {
		per_host
	}
}
```

## Prometheus

[Prometheus](https://prometheus.io) is a monitoring platform that collects
metrics from monitored targets by scraping metrics HTTP endpoints on these
targets. As well as helping you to display metrics with a dashboarding tool like [Grafana](https://grafana.com/docs/grafana/latest/introduction/), Prometheus is also used for [alerting](https://prometheus.io/docs/alerting/latest/overview/).

Like Caddy, Prometheus is written in Go and distributed as a single binary. To
install it, see the [Prometheus Installation docs](https://prometheus.io/docs/prometheus/latest/installation/),
or on MacOS just run `brew install prometheus`.

Read the [Prometheus docs](https://prometheus.io/docs/introduction/first_steps/)
if you're brand new to Prometheus, otherwise read on!

To configure Prometheus to scrape from Caddy you'll need a YAML configuration
file similar to this:

```yaml
# prometheus.yaml
global:
  scrape_interval: 15s # default is 1 minute

scrape_configs:
  - job_name: caddy
    static_configs:
      - targets: ['localhost:2019']
```

You can then start up Prometheus like this:

```console
$ prometheus --config.file=prometheus.yaml
```

## Caddy's metrics

Like any process monitored with Prometheus, Caddy exposes an HTTP endpoint
that responds in the [Prometheus exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format).
Caddy's Prometheus client is also configured to respond with the [OpenMetrics exposition format](https://pkg.go.dev/github.com/prometheus/client_golang@v1.7.1/prometheus/promhttp#HandlerOpts)
if negotiated (that is, if the `Accept` header is set to
`application/openmetrics-text; version=0.0.1`).

By default, there is a `/metrics` endpoint available at the [admin API](/docs/api)
(i.e. http://localhost:2019/metrics). But if the admin API is
disabled or you wish to listen on a different port or path, you can use the
[`metrics` handler](/docs/caddyfile/directives/metrics) to configure this.

You can see the metrics with any browser or HTTP client like `curl`:

```console
$ curl http://localhost:2019/metrics
# HELP caddy_admin_http_requests_total Counter of requests made to the Admin API's HTTP endpoints.
# TYPE caddy_admin_http_requests_total counter
caddy_admin_http_requests_total{code="200",handler="metrics",method="GET",path="/metrics"} 2
# HELP caddy_http_request_duration_seconds Histogram of round-trip request durations.
# TYPE caddy_http_request_duration_seconds histogram
caddy_http_request_duration_seconds_bucket{code="308",handler="static_response",method="GET",server="remaining_auto_https_redirects",le="0.005"} 1
caddy_http_request_duration_seconds_bucket{code="308",handler="static_response",method="GET",server="remaining_auto_https_redirects",le="0.01"} 1
caddy_http_request_duration_seconds_bucket{code="308",handler="static_response",method="GET",server="remaining_auto_https_redirects",le="0.025"} 1
...
```

There are a number of metrics you'll see, that broadly fall under 4 categories:

- Runtime metrics
- Admin API metrics
- HTTP Middleware metrics
- Reverse proxy metrics

### Runtime metrics

These metrics cover the internals of the Caddy process, and are provided
automatically by the Prometheus Go Client. They are prefixed with `go_*` and
`process_*`.

Note that the `process_*` metrics are only collected on Linux and Windows.

See the documentation for the [Go Collector](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#NewGoCollector),
[Process Collector](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#NewProcessCollector),
and [BuildInfo Collector](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#NewBuildInfoCollector).

### Admin API metrics

These are metrics that help to monitor the Caddy admin API. Each of the admin
endpoints is instrumented to track request counts and errors.

These metrics are prefixed with `caddy_admin_*`.

For example:

```console
$ curl -s http://localhost:2019/metrics | grep ^caddy_admin
caddy_admin_http_requests_total{code="200",handler="admin",method="GET",path="/config/"} 1
caddy_admin_http_requests_total{code="200",handler="admin",method="GET",path="/debug/pprof/"} 2
caddy_admin_http_requests_total{code="200",handler="admin",method="GET",path="/debug/pprof/cmdline"} 1
caddy_admin_http_requests_total{code="200",handler="load",method="POST",path="/load"} 1
caddy_admin_http_requests_total{code="200",handler="metrics",method="GET",path="/metrics"} 3
```

#### `caddy_admin_http_requests_total`

A counter of the number of requests handled by admin endpoints, including
modules in the `admin.api.*` namespace.

Label  | Description
-------|------------
`code` | HTTP status code
`handler` | The handler or module name
`method` | The HTTP method
`path` | The URL path the admin endpoint was mounted to

#### `caddy_admin_http_request_errors_total`

A counter of the number of errors encountered in admin endpoints, including
modules in the `admin.api.*` namespace.

Label  | Description
-------|------------
`handler` | The handler or module name
`method` | The HTTP method
`path` | The URL path the admin endpoint was mounted to

### HTTP Middleware metrics

All Caddy HTTP middleware handlers are instrumented automatically for
determining request latency, time-to-first-byte, errors, and request/response
body sizes.

<aside class="tip">
	Because all middleware handlers are instrumented, and many requests are handled by multiple handlers, make sure not to simply sum all the counters together.
</aside>

For the histogram metrics below, the buckets are currently not configurable.
For durations, the default ([`prometheus.DefBuckets`](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#pkg-variables)
set of buckets is used (5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, and 10s).
For sizes, the buckets are 256b, 1kiB, 4kiB, 16kiB, 64kiB, 256kiB, 1MiB, and 4MiB.

#### `caddy_http_requests_in_flight`

A gauge of the number of requests currently being handled by this server.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name

#### `caddy_http_request_errors_total`

A counter of middleware errors encountered while handling requests.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name

#### `caddy_http_requests_total`

A counter of HTTP(S) requests made.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name

#### `caddy_http_request_duration_seconds`

A histogram of the round-trip request durations.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name
`code` | HTTP status code
`method` | The HTTP method

#### `caddy_http_request_size_bytes`

A histogram of the total (estimated) size of the request. Includes body.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name
`code` | HTTP status code
`method` | The HTTP method

#### `caddy_http_response_size_bytes`

A histogram of the size of the returned response body.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name
`code` | HTTP status code
`method` | The HTTP method

#### `caddy_http_response_duration_seconds`

A histogram of time-to-first-byte for responses.

Label  | Description
-------|------------
`server` | The server name
`handler` | The handler or module name
`code` | HTTP status code
`method` | The HTTP method

### Reverse proxy metrics

#### `caddy_reverse_proxy_upstreams_healthy`

A gauge of the reverse proxy upstreams healthiness.

Value `0` means the upstream is unhealthy, where as `1` means the upstream is healthy.

Label  | Description
-------|------------
`upstream` | Address of the upstream

## Sample Queries

Once you have Prometheus scraping Caddy's metrics, you can start to see some
interesting metrics about how Caddy's performing.

<aside class="tip">

If you've started up a Prometheus server to scrape Caddy with the config above, try pasting these queries into the Prometheus UI at [http://localhost:9090/graph](http://localhost:9090/graph)

</aside>


For example, to see the per-second request rate, as averaged over 5 minutes:

```
rate(caddy_http_requests_total{handler="file_server"}[5m])
```

To see the rate at which your latency threshold of 100ms is being exceeded:

```
sum(rate(caddy_http_request_duration_seconds_count{server="srv0"}[5m])) by (handler)
-
sum(rate(caddy_http_request_duration_seconds_bucket{le="0.100", server="srv0"}[5m])) by (handler)
```

To find the 95th percentile request duration on the `file_server`
handler, you can use a query like this:

```
histogram_quantile(0.95, sum(caddy_http_request_duration_seconds_bucket{handler="file_server"}) by (le))
```

Or to see the median response size in bytes for successful `GET` requests on the
`file_server` handler:

```
histogram_quantile(0.5, caddy_http_response_size_bytes_bucket{method="GET", handler="file_server", code="200"})
```
