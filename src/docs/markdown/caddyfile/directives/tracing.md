---
title: tracing (Caddyfile directive)
---

# tracing

Enables integration with OpenTelemetry tracing facilities, using [`opentelemetry-go` <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/open-telemetry/opentelemetry-go).

When enabled, it will propagate an existing trace context or initialize a new one.

It uses [gRPC](https://github.com/grpc/) as an exporter protocol and  W3C [tracecontext](https://www.w3.org/TR/trace-context/) and [baggage](https://www.w3.org/TR/baggage/) as propagators.

The trace ID and span ID are added to [access logs](/docs/caddyfile/directives/log) as the standard `traceID` and `spanID` fields. Additionally, the `{http.vars.trace_id}` and `{http.vars.span_id}` placeholders are available; for example, you can use them in a [`request_header`](request_header) to pass the IDs to your app.



## Syntax

```caddy-d
tracing {
	span <span_name>
	span_attributes {
		<attr1> <value1>
		<attr2> <value2>
	}
}
```

- **&lt;span_name&gt;** is a span name. Please see span [naming guidelines](https://github.com/open-telemetry/opentelemetry-specification/blob/v1.7.0/specification/trace/api.md).
- **&lt;span_attributes&gt;** are additional attributes attached to each recorded span. Many span attributes are set by default according to OTEL [Semantic conventions for HTTP spans](https://opentelemetry.io/docs/specs/semconv/http/http-spans/) like details about the request, response and client.

  [Placeholders](/docs/caddyfile/concepts#placeholders) may be used in span names and attributes. Keep in mind that the span name is set before the request is forwarded, so only request placeholders may be used. All placeholders are available in span attributes.



## Configuration

### Environment variables

It can be configured using the environment variables defined
by the [OpenTelemetry Environment Variable Specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/configuration/sdk-environment-variables.md).

For the exporter configuration details, please
see [spec](https://github.com/open-telemetry/opentelemetry-specification/blob/v1.7.0/specification/protocol/exporter.md).

For example:

```bash
export OTEL_EXPORTER_OTLP_HEADERS="myAuthHeader=myToken,anotherHeader=value"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://my-otlp-endpoint:55680
```



## Examples

Here is a **Caddyfile** example:

```caddy
example.com {
	handle /api* {
		tracing {
			span api
		}
		request_header X-Trace-Id {http.vars.trace_id}
		reverse_proxy localhost:8081
	}

	handle {
		tracing {
			span app
			span_attributes {
				user_id {http.request.cookie.user-id}
			}
		}
		reverse_proxy localhost:8080
	}
}
```
