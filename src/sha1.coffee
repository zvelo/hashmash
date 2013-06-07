"use strict"

`if(typeof define !== 'function'){var define = (require('amdefine'))(module);}`
define ->
  ROTL = (x, n) ->
    return (x << n) | (x >>> (32 - n))

  toHexStr = (n) ->
    s = ""

    for i in [ 7 .. 0 ]
      v = (n >>> (i * 4)) & 0xf
      s += v.toString 16

    s

  f = (s, x, y, z) ->
    switch s
      when 0 then (x & y) ^ (~x & z)           ## Ch()
      when 1 then x ^ y ^ z                    ## Parity()
      when 2 then (x & y) ^ (x & z) ^ (y & z)  ## Maj()
      when 3 then x ^ y ^ z                    ## Parity()

  _sha1hash = (msg) ->
    ## constants [4.2.1]
    K = [
      0x5a827999
      0x6ed9eba1
      0x8f1bbcdc
      0xca62c1d6
    ]

    ## PREPROCESSING

    ## add trailing '1' bit (+ 0's padding) to string [5.1.1]
    msg += String.fromCharCode 0x80

    ## convert string msg into 512-bit / 16-integer blocks
    ## arrays of ints [5.2.1]

    ## length (in 32-bit integers) of msg + 1 + appended length
    l = msg.length / 4 + 2

    ## number of 16-integer-blocks required to hold 'l' ints
    N = Math.ceil l / 16

    M = []

    for i in [ 0 .. N - 1 ]
      M[i] = []

      for j in [ 0 .. 15 ] ## encode 4 chars per integer, big-endian encoding
        ## note running off the end of msg is ok
        ## 'cos bitwise ops on NaN return 0
        M[i][j] = (msg.charCodeAt(i * 64 + j * 4 + 0) << 24) |
                  (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
                  (msg.charCodeAt(i * 64 + j * 4 + 2) <<  8) |
                  (msg.charCodeAt(i * 64 + j * 4 + 3) <<  0)

    ## add length (in bits) into final pair of 32-bit integers (big-endian)
    ## [5.1.1]
    ## note: most significant word would be (len - 1) * 8 >>> 32,
    ## but since JS converts bitwise-op args to 32 bits,
    ## we need to simulate this by arithmetic operators

    TWO_TO_THIRTY_TWO = 4294967296  ## Math.pow(2, 32)
    M[N - 1][14] = ((msg.length - 1) * 8) / TWO_TO_THIRTY_TWO
    M[N - 1][14] = Math.floor(M[N - 1][14])
    M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff

    ## set initial hash value [5.3.1]
    H0 = 0x67452301
    H1 = 0xefcdab89
    H2 = 0x98badcfe
    H3 = 0x10325476
    H4 = 0xc3d2e1f0

    ## HASH COMPUTATION [6.1.2]

    W = []

    for i in [ 0 .. N - 1]
      ## 1 - prepare message schedule 'W'
      W[t] = M[i][t] for t in [ 0 .. 15 ]

      for t in [ 16 .. 79 ]
        W[t] = ROTL W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1

      ## 2 - initialise five working variables a, b, c, d, e
      ## with previous hash value
      a = H0
      b = H1
      c = H2
      d = H3
      e = H4

      ## 3 - main loop
      for t in [ 0 .. 79 ]
        ## seq for blocks of 'f' functions and 'K' constants
        s = Math.floor t / 20
        T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) & 0xffffffff
        e = d
        d = c
        c = ROTL(b, 30)
        b = a
        a = T

      ## 4 - compute the new intermediate hash value
      H0 = (H0 + a) & 0xffffffff  ## note 'addition modulo 2^32'
      H1 = (H1 + b) & 0xffffffff
      H2 = (H2 + c) & 0xffffffff
      H3 = (H3 + d) & 0xffffffff
      H4 = (H4 + e) & 0xffffffff

    return toHexStr(H0) +
           toHexStr(H1) +
           toHexStr(H2) +
           toHexStr(H3) +
           toHexStr(H4)

  _leading0s = (hexStr) ->
    num = 0
    for pos in [ 0 .. hexStr.length - 1 ]
      curNum = parseInt hexStr[pos], 16
      break if isNaN curNum

      switch
        when curNum is 0b0000           then num += 4  ## continue
        when curNum is 0b0001           then num += 3
        when 0b0010 <= curNum <= 0b0011 then num += 2
        when 0b0100 <= curNum <= 0b0111 then num += 1

      break unless curNum is 0

    num

  _tryChallenge = (data) ->
    challenge = "#{data.challenge}:#{data.counter}"
    sha = _sha1hash challenge

    if _leading0s(sha) >= data.bits
      data.result = challenge
      return true

    data.counter += 1
    return false

  sha1              = (msg)    -> _sha1hash(msg)
  sha1.leading0s    = (hexStr) -> _leading0s(hexStr)
  sha1.tryChallenge = (data)   -> _tryChallenge(data)

  return sha1
