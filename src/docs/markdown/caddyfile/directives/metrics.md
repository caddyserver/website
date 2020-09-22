---
title: metrics (Caddyfile directive)
---

# metrics

Configures a Prometheus metrics exposition endpoint so the gathered metrics can
be exposed for scraping.

Note that a `/metrics` endpoint is also attached to the [admin API](/docs/api),
which is not configurable, and is not available when the admin API is disabled.

This endpoint will return metrics in the [Prometheus exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format)
or, if negotiated, in the [OpenMetrics exposition format](https://pkg.go.dev/github.com/prometheus/client_golang@v1.7.1/prometheus/promhttp#HandlerOpts)
(`application/openmetrics-text`).

See also [Monitoring Caddy with Prometheus metrics](/docs/metrics).

## Syntax

```caddy-d
metrics <matcher>
```

## Examples

Expose metrics at the default `/metrics` path:

```caddy-d
metrics /metrics
```

Expose metrics at another path:

```caddy-d
metrics /foo/bar/baz
```
