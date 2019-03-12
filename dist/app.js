//node内置模块
fs = require('fs')

//express模块需安装,npm i -D express
// app = require('express')

//node内置模块
// http = require('http')

//socket.io模块需安装,npm i -D socket.io
// socketIO = require('socket.io')

//underscore模块需安装,npm i -D underscore
_ = require('underscore')

//sanitizer模块需安装,npm i -D sanitizer
sanitizer = require('sanitizer')

//memcache模块需要events.EventEmitter,在process.EventEmitter上
//process.EventEmitter = require('events').EventEmitter

//memcache模块需安装,npm i -D memcache
//memcache = require('memcache')

getIO = function(){
    var app = require('express')()
    var http = require('http').Server(app)
    let io = require('socket.io')(http)
    return {http:http,io:io}
}

//启动ts编译后的js
let bundle = require('./bundle')
bundle.main.main()