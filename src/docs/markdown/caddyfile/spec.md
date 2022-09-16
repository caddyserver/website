---
title: Caddyfile Spec
---

TODO: this page is unfinished

<style>
	
</style>

# Caddyfile Specification

This page describes the syntax of the Caddyfile. If it is your first time writing a Caddyfile, try the <a href="/v1/tutorial/caddyfile">Caddyfile primer</a> tutorial instead. This page is not beginner-friendly; it is technical and kind of boring.

Although this article is verbose, the Caddyfile is designed to be easily readable and writable by humans. You will find that it is easy to remember, not cumbersome, and flows off the fingers.

The term "Caddyfile" often refers to a file, but more generally means a blob of Caddy configuration text. A Caddyfile can be used to configure any Caddy server type: HTTP, DNS, etc. The basic structure and syntax of the Caddyfile is the same for all server types, but semantics change. Because of this variability, this document treats the Caddyfile only as the generic configuration syntax as it applies to all server types. Caddyfile documentation for specific types may be found within their respective docs. For instance, the HTTP server <a href="/v1/docs/http-caddyfile">documents the semantics of its Caddyfile</a>.

#### Topics

1. [File format & encoding](#)
2. [Lexical syntax](#)
3. [Structure](#)
4. [Labels](#)
5. [Directives](#)
6. [Environment variables](#)
7. [Import](#)
8. [Reusable snippets](#)
9. [Examples](#)


## File Format &amp; Encoding

The Caddyfile is plain Unicode text encoded with UTF-8. Each code point is distinct; specifically, lowercase and uppercase characters are different. A leading byte order mark (0xFEFF), if present, will be ignored.



## Lexical Syntax

A <b>token</b> is a sequence of whitespace-delimited characters in the Caddyfile. A token that starts with quotes <code>"</code> is read literally (including whitespace) until the next instance of quotes <code>"</code> that is not escaped. Quote literals may be escaped with a backslash like so: <code>\"</code>. Only quotes are escapable. <!-- Those stupid --> &ldquo;Smart quotes&rdquo; are not valid as quotes.

<b>Lines</b> are delimited with the <code>\n</code> (newline) character only. Carriage return <code>\r</code> is discarded unless quoted. Blank, unquoted lines are allowed and ignored.

<b>Comments</b> are discarded by the lexer. Comments begin with an unquoted hash <code>#</code> and continue to the end of the line. Comments may start a line or appear in the middle of a line as part of an unquoted token. For the purposes of this document, commented and blank lines are no longer considered.

Tokens are then evaluated by the parser for structure.

## Structure

A Caddyfile has no global scope or inheritence between separate blocks. The most global unit of the Caddyfile is an <b>entry</b>. An entry consists of a list of labels and a definition associated with those labels. A <b>label</b> is a string identifier, and a <b>definition</b> is a body (one or more lines) of tokens grouped together in a <i>block</i>:

<code class="block"><span class="cf-label-bg">list of labels</span>
<span class="cf-block-bg">definition (block)</span></code>

A Caddyfile with <i>only one</i> entry may consist simply of the label line(s) followed by the definition on the next line(s), as shown above. However, a Caddyfile with <i>more than one</i> entry <b>must</b> enclose each definition in curly braces <code>{ }</code>. The opening curly brace <code>{</code> must be at the end of the label line, and the closing curly brace <code>}</code> must be the only token on its line:

<code class="block"><span class="cf-label-bg">list of labels</span> <span class="cf-bigbrace">{</span>
<span class="cf-block-bg indent">definition (block)</span>
<span class="cf-bigbrace">}</span>
<span class="cf-label-bg">list of labels</span> <span class="cf-bigbrace">{</span>
<span class="cf-block-bg indent">definition (block)</span>
<span class="cf-bigbrace">}</span></code>
<p>
Consistent tab indentation is encouraged within blocks enclosed by curly braces.
</p>
<p>
<b>The first line of a Caddyfile is always a label line.</b> Comment lines, empty lines, and <a href="/v1/docs/import">import</a> lines are the exceptions.
</p>

<h3 id="labels">Labels</h3>
<p>
Labels are the only tokens that appear outside of blocks (with one exception being the <a href="/v1/docs/import">import</a> directive). A label line may have just one label:
</p>
<code class="block"><span class="cf-addr">label</span></code>
<p>
or several labels, separated by spaces:
</p>
<code class="block"><span class="cf-addr">label1 label2</span> ...</code>
<p>
If many labels are to head a block, the labels may be suffixed with a comma. A comma-suffixed label may be followed by a newline, in which case the next line will be considered part of the same line:
</p>
<code class="block"><span class="cf-addr">label1</span>,
<span class="cf-addr">label2</span></code>
<p>
Mixing of these patterns is valid (but discouraged), as long as the last label of the line has a comma if the next line is to continue the list of labels:
</p>
<code class="block"><span class="cf-addr">label1 label2</span>,
<span class="cf-addr">label3</span>, <span class="cf-addr">label4</span>,
<span class="cf-addr">label5</span></code>
<p>
A definition with multiple labels is replicated across each label as if they had been defined separately but with the same definition.
</p>

<h3 id="directives">Directives</h3>
<p>
The body of the definition follows label lines. The first token of each line in a definition body is a <b>directive</b>. Every token <i>after</i> the directive on the same line is an <b>argument</b>. Arguments are optional:
</p>
<code class="block"><span class="cf-dir">directive1</span>
<span class="cf-dir">directive2</span> <span class="cf-arg">arg1 arg2</span>
<span class="cf-dir">directive3</span> <span class="cf-arg">arg3</span></code>
<p>
Commas are not acceptable delimiters for arguments; they will be treated as part of the argument value. Arguments are delimited solely by same-line whitespace.
</p>
<p>
Directives may span multiple lines by opening a block. Blocks are enclosed by curly braces <code>{ }</code>. The opening curly brace <code>{</code> must be at the end of the directive's first line, and the closing curly brace <code>}</code> must be the only token on its line:
</p>
<code class="block"><span class="cf-dir">directive</span> {
...
}</code>
<p>
Within a directive block, the first token of each line may be considered a <b>subdirective</b> or <b>property</b>, depending on how it is used (other terms may be applied). And as before, they can have arguments:
</p>
<code class="block"><span class="cf-dir">directive</span> <span class="cf-arg">arg1</span> {
<span class="cf-subdir">subdir</span> arg2 arg3
...
}</code>
<p>
Subdirectives cannot open new blocks. In other words, nested directive blocks are not supported. If a directive block is empty, the curly braces should be omitted entirely.
</p>

<h3 id="env">Environment Variables</h3>
<p>
Any token (label, directive, argument, etc.) may contain or consist solely of an environment variable, which takes the Unix form or Windows form, enclosed in curly braces <code>{ }</code> without extra whitespace:
</p>
<code class="block"><span class="cf-addr">label_{$ENV_VAR_1}</span>
<span class="cf-dir">directive</span> <span class="cf-arg">{%ENV_VAR_2%}</span></code>
<p>
Either form works on any OS. A single environment variable does not expand out into multiple tokens, arguments, or values.
</p>

<h3 id="import">Import</h3>
<p>
The <a href="/v1/docs/import">import</a> directive is a special case, because it can appear outside a definition block. The consequence of this is that no label can take on the value of "import".
</p>
<p>
Where an import line is, that line will be replaced with the contents of the imported file, unmodified. See the <a href="/v1/docs/import">import docs</a> for more information.
</p>

<h3 id="snippets">Reusable Snippets</h3>
<p>
You can define snippets to be reused later in your Caddyfile by defining a block with a single-token label surrounded by parentheses:
</p>
<code class="block"><span class="cf-addr">(mysnippet)</span> {
...
}</code>
<p>
Then you can invoke the snippet with the <code>import</code> directive:
</p>
<p>
<code class="block"><span class="cf-dir">import</span> <span class="cf-arg">mysnippet</span></code>

<h3 id="examples">Examples</h3>
<p>
A very simple Caddyfile with only one entry:
<code class="block"><span class="cf-addr">label1</span>

<span class="cf-dir">directive1</span> <span class="cf-arg">argument1</span>
<span class="cf-dir">directive2</span></code>
</p>

<p>
Appending the prior example with another entry introduces the need for curly braces:
<code class="block"><span class="cf-addr">label1</span> {
<span class="cf-dir">directive1</span> <span class="cf-arg">arg1</span>
<span class="cf-dir">directive2</span>
}
<span class="cf-addr">label2</span>, <span class="cf-addr">label3</span> {
<span class="cf-dir">directive3</span> <span class="cf-arg">arg2</span>
<span class="cf-dir">directive4</span> <span class="cf-arg">arg3</span> <span class="cf-arg">arg4</span>
}
</code>
</p>

<p>
Some people prefer to always use braces even if there's just one entry; this is fine, but unnecessary:
<code class="block"><span class="cf-addr">label1</span> {
<span class="cf-dir">directive1</span> <span class="cf-arg">arg1</span>
<span class="cf-dir">directive2</span>
}</code>
</p>

<p>
Example in which a directive opens a block:
<code class="block"><span class="cf-addr">label1</span>

<span class="cf-dir">directive</span> <span class="cf-arg">arg1</span> {
<span class="cf-subdir">subdir</span> arg2 arg3
}
<span class="cf-dir">directive</span> <span class="cf-arg">arg4</span></code>
</p>

<p>
Similarly, but in an indented definition body, and with a comment:
<code class="block"><span class="cf-addr">label1</span> {
<span class="cf-dir">directive1</span> <span class="cf-arg">arg1</span>
<span class="cf-dir">directive2</span> <span class="cf-arg">arg2</span> {
<span class="cf-subdir">subdir1</span> arg3 arg4
<span class="cf-subdir">subdir2</span>
<span class="cf-comment"># nested blocks not supported</span>
}
<span class="cf-dir">directive3</span>
}</code>
</p>
