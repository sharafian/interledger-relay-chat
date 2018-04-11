# ILRC
> InterLedger Relay Chat

- [Overview](#overview)
- [Protocol Definition](#protocol-definition)
- [TODOs](#todos)

![Screenshot of CLI](./screenshot.png)

## Overview

ILRC is a chat protocol that rides on top of the Interledger stack instead of
the Internet stack. Using the STREAM protocol to multiplex data and money, ILRC
allows any message to be paid.

ILRC comes with a server and a client implementation.

## Protocol Definition

ILRC is based on a JSON protocol, which differentiates it from IRC (based in plaintext).

#### Nick

Set nickname. Equivalent to IRC's `NICK`.

```json
{
  "type": "nick",
  "nick": "Alice"
}
```

#### Privmsg

Send message to channel or user. Equivalent to IRC's `PRIVMSG`.

```json
{
  "type": "privmsg",
  "channel": "#global",
  "message": "Hello World!"
}
```

## TODOs

- [X] Join and register nickname
- [X] Send message
- [ ] Send message with money
- [ ] Join channels
- [X] Fix up UI
- [ ] Neaten up code
- [X] Connect by Payment Pointer
