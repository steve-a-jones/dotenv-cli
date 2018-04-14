#!/usr/bin/env node

var spawn = require('cross-spawn')
var path = require('path')

var argv = require('minimist')(process.argv.slice(2))
var dotenv = require('dotenv')

var dotenvExpand = function (config, override) {
    var interpolate = function (env) {
      var matches = env.match(/\$([a-zA-Z0-9_]+)|\${([a-zA-Z0-9_]+)}/g) || []
  
      matches.forEach(function (match) {
        var key = match.replace(/\$|{|}/g, '')
  
        // process.env value 'wins' over .env file's value
        var variable = process.env[key] || config.parsed[key] || ''
  
        // Resolve recursive interpolations
        variable = interpolate(variable)
  
        env = env.replace(match, variable)
      })
  
      return env
    }
  
    for (var configKey in config.parsed) {
      var value = (!override) ? process.env[configKey] || config.parsed[configKey] : config.parsed[configKey] || process.env[configKey]
  
      if (config.parsed[configKey].substring(0, 2) === '\\$') {
        config.parsed[configKey] = value.substring(1)
      } else if (config.parsed[configKey].indexOf('\\$') > 0) {
        config.parsed[configKey] = value.replace(/\\\$/g, '$')
      } else {
        config.parsed[configKey] = interpolate(value)
      }
    }
  
    for (var processKey in config.parsed) {
      process.env[processKey] = config.parsed[processKey]
    }
  
    return config
  }
  

var paths = ['.env']
if (argv.e) {
  if (typeof argv.e === 'string') {
    paths = [argv.e]
  } else {
    paths = argv.e
  }
}
paths.forEach(function (env) {
    dotenvExpand(dotenv.config({path: path.resolve(env)}), true)
})


if (argv.p) {
    console.log(process.env);
//   console.log(process.env[argv.p])
  process.exit()
}

spawn(argv._[0], argv._.slice(1), {stdio: 'inherit'})
  .on('exit', function (exitCode) {
    process.exit(exitCode)
  })
