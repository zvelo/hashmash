importScripts "require.js"

require.config
  baseUrl: "."
  packages: [
    name:     "poly"
    location: "poly"
    main:     "poly"
  ,
    name:     "hashmash_worker"
    location: "hashmash"
    main:     "worker"
  ]
  deps: [ "poly/function" ]
  callback: -> require [ "hashmash_worker" ]
