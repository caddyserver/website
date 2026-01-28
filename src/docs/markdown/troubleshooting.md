Troubleshooting Strategies
=====================

This page presents a general, methodical framework for fixing on your own most kinds of problems you might encounter when using Caddy _without the use of AI_. We recommend similar steps when asking for help in our forums. In many cases, you can answer your own question or fix your own problems by applying some critical thinking.


What do you know?
-----------------

You may not know what the problem is, what is causing it, or how to fix it, so let's start with some fundamental things you surely do know:

### What you expect

Say this out loud, or in your head, or write/type it. Be clear and specific so that there's no doubt or room for ambiguity. You might even explain to yourself _why_ that's what you expect.

"It should work" is not a good expectation.

"I expect a 301 redirect when I make a request to this URI" is much better.


### Current behavior

Observe what is happening. What _exactly_ is happening, and how does it contrast with your expectation? Synthesize what you do know.

"It doesn't work" is unhelpful and lazy; avoid this phrase everywhere except perhaps as a shorthand descriptor for a specific behavior that has already been documented in detail.

"Instead of a 301 response, I'm getting a 200 response, although I do see the `Server: Caddy` header," is much better since it compares and contrasts what you know with what you expect, and it synthesizes other known information, which tells us that the request is at least reaching a Caddy instance.


### Logs

What is in Caddy's logs? By default, these are written to the terminal that started the process. If running "detached" like as a system service, you may have to get the logs from elsewhere.

Note that HTTP request logs ("access logs") are different from process logs, and need to be explicitly enabled in your config.

You may also want to enable DEBUG-level logging if you haven't already.

But either way, one of the first things you should do is look at the logs. _All of them._ Message context matters, so a single log line in isolation is seldom useful. Collect more than you think you need and preserve it through the troubleshooting process.

Are there any hints in the logs?


Recognize and doubt assumptions
-------------------------------

Before going any further, we must emphasize how crucial it is to criticize what you assume. We all make assumptions based on what we're used to and what we expect. "Be mindful of your assumptions, and great will be your power." (&mdash;Yoda, or something.)

For example, a common assumption is that after recompiling Caddy, running `caddy` will cause the new code to run. This is only true if your compiled binary replaced the one in your `$PATH`. Instead, `./caddy` is usually the proper invocation.

Assumptions layer on as your deployment or configuration grows more complex. For example, deploying in Docker involves rebuilding an image and running it, which multiplies the assumptions you might make.

Many questions and bug reports end up being issues with external system and network configurations, not Caddy itself. For example, if you can't connect to your Caddy instance, but Caddy is clearly running, you probably assume it's not DNS. Hint: it's almost always DNS.

Even just assuming that you reloaded a config, but you really didn't, is a common mistake. Strive to be rigorous about your process. Verify at every level.


Reproduce the behavior
----------------------

This is a key step that often causes problems to fix themselves: make the problem happen again.

Specifically, make it happen again _in the most minimal way possible_. Eliminate unnecessary config, deployment steps, environmental factors, etc., until the problem goes away.

A common strategy is to eliminate just one thing at a time, and retry, until the problem disappears. Then that thing you removed is likely the cause, or&mdash;and this is a good place to doubt assumptions&mdash;some combination of the last thing and what you removed before it are the cause. Verify by adding in the first things to be removed. Narrow it down.

Another idea is to eliminate about half of everything at each iteration, and once the problem goes away, eliminate just half of that half, and so on. This is like a binary search and can be quicker.

Alternatively, instead of elimination, you could invert these strategies and incrementally build your config or scenario from the ground-up, retrying each time, until the problem appears.

Often, this process alone will identify the problem and the fix might become obvious. If not, you can at least write down the minimal steps to reproduce the problem.


Explore behaviors
-----------------

With the steps known to reproduce the problem, you are well-situated to diagnose a cause. This involves tinkering and, if you're savvy, reading the code.

If you cannot explain why the problem is occuring, vary the behavior. Make a small change and try again. For example, if your relevant config involves a regular expression, change/simplify the expression&mdash;or remove it entirely&mdash;and see if you do _something_ to get the behavior you are looking for. Even if it's not what you want, at least you know it's a problem with the regular expression or the config.

As you explore, notice patterns of what works and what doesn't. This should lead you down the path to a solution.

If you find a solution, then you can decide if it should be a bug or not. Sometimes it's not obvious whether it's a bug; it's okay to post an issue with your experiments and get maintainer feedback either way.

And if it's not a bug, congrats! You solved a problem and learned at least something in the process.

Consider posting about your experience [in the forum](https://caddy.community) to help others who may encounter the same problem.