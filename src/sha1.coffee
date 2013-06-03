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

exports.hash = (msg) ->
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

  ## convert string msg into 512-bit / 16-integer blocks arrays of ints [5.2.1]

  ## length (in 32-bit integers) of msg + 1 + appended length
  l = msg.length / 4 + 2

  ## number of 16-integer-blocks required to hold 'l' ints
  N = Math.ceil l / 16

  M = []

  for i in [ 0 .. N - 1 ]
    M[i] = []

    for j in [ 0 .. 15 ] ## encode 4 chars per integer, big-endian encoding
      ## note running off the end of msg is ok 'cos bitwise ops on NaN return 0
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
      s = Math.floor t / 20 ## seq for blocks of 'f' functions and 'K' constants
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
