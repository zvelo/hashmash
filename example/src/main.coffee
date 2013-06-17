require.config
  baseUrl: "js"
  paths:
    jquery: "//ajax.googleapis.com/ajax/libs/jquery/2.0.1/jquery.min"
  packages: [
    name:     "poly"
    location: "poly"
    main:     "poly"
  ]
  deps: [ "poly/function", "jquery" ]
  callback: -> require [ "example" ]
